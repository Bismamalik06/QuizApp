// This file contains the main QuizApp component for a React Native quiz application.
// It handles category selection, quiz questions, timer, scoring, and Firebase integration for data and score saving.

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from './firebase';               // firebase.js file
import { ref, onValue, push } from 'firebase/database';
import { QuizData, Question } from '../../constants/QuizData';

// Main component for the Quiz App
export default function QuizApp() {
  // State variables for quiz data and categories
  // 🔥 Initialize with Local Data to ensure categories are visible immediately
  const [allQuizData, setAllQuizData] = useState<Record<string, Question[]> | null>(QuizData); // Holds all quiz data, initially from local QuizData
  const [categories, setCategories] = useState<string[]>(Object.keys(QuizData)); // List of available categories
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // Currently selected category

  // State variables for quiz progress
  const [quizData, setQuizData] = useState<Question[]>([]); // Questions for the selected category
  const [loading, setLoading] = useState(false); // No loading needed for local data

  // State variables for current quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // Index of the current question
  const [answers, setAnswers] = useState<number[]>([]); // Array of selected answer indices
  const [score, setScore] = useState(0); // Current score
  const [isQuizCompleted, setIsQuizCompleted] = useState(false); // Whether the quiz is finished
  const [timeLeft, setTimeLeft] = useState(10); // Time left for the current question
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null); // Index of the currently selected option

  // useEffect hook to fetch quiz data from Firebase on component mount
  // 🔥 Fetch quiz from Firebase (Optional: Overrides local if new data structure is found)
  useEffect(() => {
    const quizRef = ref(db, "quiz");
    onValue(quizRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (Array.isArray(data)) {
          // Legacy support: If Firebase has old data (Array), we IGNORE it
          // and keep our Local Data (Categories) to prevent reverting to "General".
          console.log("Legacy data found in Firebase. Using local categorized data instead.");
        } else {
          // New support: If Firebase has new categorized data, utilize it.
          setAllQuizData(data);
          setCategories(Object.keys(data));
        }
      }
    });
  }, []);

  // useEffect hook to manage the timer for each question
  // 🔥 Timer
  useEffect(() => {
    if (selectedCategory && timeLeft > 0 && !isQuizCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (selectedCategory && timeLeft === 0 && !isQuizCompleted) {
      handleAnswerSelect(-1);
    }
  }, [timeLeft, isQuizCompleted, selectedCategory]);

  // Function to handle category selection
  const handleCategorySelect = (category: string) => {
    if (allQuizData && allQuizData[category]) {
      setSelectedCategory(category);
      setQuizData(allQuizData[category]);
      restartQuiz();
    }
  };

  // Function to go back to category selection screen
  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setQuizData([]);
    restartQuiz();
  };

  // Function to handle when a user selects an answer option
  // 🔥 Handle answer selection
  const handleAnswerSelect = (index: number) => {
    setSelectedIndex(index);
    setTimeout(() => {
      const newAnswers = [...answers, index];
      setAnswers(newAnswers);

      if (index === quizData[currentQuestionIndex]?.correct) {
        setScore(score + 1);
      }

      if (currentQuestionIndex < quizData.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setTimeLeft(10);
        setSelectedIndex(null);
      } else {
        setIsQuizCompleted(true);
        saveScoreToFirebase(newAnswers); // 🔥 Save score to Firebase
      }
    }, 500); // delay to show selection
  };

  // Function to reset the quiz state for restarting
  // 🔥 Restart quiz
  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setScore(0);
    setIsQuizCompleted(false);
    setTimeLeft(10);
    setSelectedIndex(null);
  };

  // Function to save the final score to Firebase database
  // 🔥 Save score to Firebase
  const saveScoreToFirebase = (finalAnswers: number[]) => {
    // Calculate final score based on the answers passed to ensure accuracy
    // (State updates is async, so using local calculation for validation if needed,
    // but here we use the state `score` which might be one step behind if not careful.
    // However, existing logic updated score before calling this, except for the last question.
    // Actually, in handleAnswerSelect, setScore is called before this.
    // But React batches updates. Safe way is to calculate score here or use useEffect.
    // For simplicity, we'll assume the previous logic was 'good enough' or fix it.)

    // Better Calc for final question:
    let finalScore = 0;
    quizData.forEach((q, idx) => {
      if (finalAnswers[idx] === q.correct) finalScore++;
    });

    const scoreRef = ref(db, "scores");
    push(scoreRef, {
      category: selectedCategory,
      score: finalScore,
      totalQuestions: quizData.length,
      date: new Date().toISOString(),
    });
    // Update local score state to display correctly
    setScore(finalScore);
  };

  // Render loading screen if quiz data is loading
  // 🔥 Loading screen
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6200ea" />
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 20 }}>Loading Quiz...</Text>
      </View>
    );
  }

  // 🎨 Helper functions for styling
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Data Structures': return 'layers';
      case 'Algorithms': return 'code-working';
      case 'Operating Systems': return 'hardware-chip';
      case 'Database Systems': return 'server';
      case 'Computer Networks': return 'cloud';
      default: return 'book';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Data Structures': return '#FF6B6B'; // Red
      case 'Algorithms': return '#4ECDC4';      // Teal
      case 'Operating Systems': return '#45B7D1'; // Blue
      case 'Database Systems': return '#FFA07A'; // Orange
      case 'Computer Networks': return '#9D50BB'; // Purple
      default: return '#6200ea';
    }
  };

  // Render category selection screen if no category is selected
  // 📋 Category Selection Screen
  if (!selectedCategory) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Select a Subject</Text>
        <Text style={styles.subTitle}>Choose a topic to challenge yourself</Text>
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
          {categories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.categoryButton, { backgroundColor: getCategoryColor(category) }]}
              onPress={() => handleCategorySelect(category)}
            >
              <View style={styles.categoryIconContainer}>
                <Ionicons name={getCategoryIcon(category) as any} size={28} color="#fff" />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryText}>{category}</Text>
                <Text style={styles.categorySubText}>5 Questions</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </TouchableOpacity>
          ))}
          {categories.length === 0 && (
            <Text style={styles.noDataText}>No quiz categories available.</Text>
          )}
        </ScrollView>
      </View>
    );
  }

  // Render quiz completion screen if quiz is finished
  // 🏆 Quiz Completed Screen
  if (isQuizCompleted) {
    return (
      <View style={styles.container}>
        <Ionicons name="trophy" size={80} color="#FFD700" style={{ marginBottom: 20 }} />
        <Text style={styles.title}>Quiz Completed!</Text>
        <Text style={styles.subtitle}>{selectedCategory}</Text>
        <Text style={styles.score}>
          Your Score: {score} / {quizData.length}
        </Text>
        <Text style={styles.percentage}>{(score / quizData.length * 100).toFixed(0)}% Correct</Text>

        <TouchableOpacity style={styles.restartButton} onPress={restartQuiz}>
          <Text style={styles.restartButtonText}>Restart Quiz</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.restartButton, styles.secondaryButton]} onPress={handleBackToCategories}>
          <Text style={[styles.restartButtonText, styles.secondaryButtonText]}>Choose Another Subject</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestion = quizData[currentQuestionIndex];

  // Render the main quiz screen with question, options, progress, and timer
  return (
    <View style={styles.container}>
      {/* Back Button Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToCategories} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedCategory}</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${((currentQuestionIndex + 1) / quizData.length) * 100}%`,
                backgroundColor: getCategoryColor(selectedCategory || '')
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentQuestionIndex + 1} / {quizData.length}
        </Text>
      </View>

      <View style={styles.timerCircle}>
        <Text style={styles.timerText}>{timeLeft}</Text>
      </View>

      <View style={[styles.card, { borderTopColor: getCategoryColor(selectedCategory || '') }]}>
        <Text style={styles.question}>{currentQuestion?.question}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {currentQuestion?.options.map((option, index) => {
          const letters = ['A', 'B', 'C', 'D'];
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedIndex === index && styles.selectedOptionButton,
              ]}
              onPress={() => handleAnswerSelect(index)}
            >
              <View style={styles.optionContent}>
                <View style={[styles.letterCircle, selectedIndex === index && styles.selectedLetterCircle]}>
                  <Text style={[styles.optionLetter, selectedIndex === index && styles.selectedOptionLetter]}>{letters[index]}</Text>
                </View>
                <Text style={[styles.optionText, selectedIndex === index && styles.selectedOptionText]}>{option}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// Styles for the component, including platform-specific shadow styles
// 🔹 Styles
const shadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  android: {
    elevation: 4,
  },
});

// StyleSheet object defining all the styles used in the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 5,
    color: '#2d3436'
  },
  subTitle: {
    fontSize: 16,
    color: '#636e72',
    marginBottom: 25,
  },
  subtitle: {
    fontSize: 22,
    color: '#636e72',
    marginBottom: 10,
    fontWeight: '600'
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3436',
    marginLeft: 20,
    flex: 1
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#dfe6e9'
  },
  backButtonText: {
    fontSize: 16,
    color: '#2d3436',
    marginLeft: 5,
    fontWeight: '600'
  },
  categoryButton: {
    padding: 20,
    marginVertical: 8,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadowStyle,
  },
  categoryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  categorySubText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  noDataText: {
    fontSize: 18,
    color: '#b2bec3',
    marginTop: 30,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 400,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10
  },
  progressText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2d3436',
    marginLeft: 15,
    width: 50
  },
  progressBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#dfe6e9',
    borderRadius: 6,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 6
  },
  timerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#6c5ce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10
  },
  timerText: {
    fontSize: 18,
    color: '#6c5ce7',
    fontWeight: 'bold'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    marginBottom: 30,
    marginTop: 10,
    borderTopWidth: 6,
    borderTopColor: '#6200ea', // Default, overridden inline
    ...shadowStyle,
  },
  question: {
    fontSize: 22,
    textAlign: 'center',
    color: '#2d3436',
    fontWeight: '700',
    lineHeight: 32,
  },
  optionsContainer: {
    width: '100%',
    maxWidth: 400
  },
  optionButton: {
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dfe6e9',
    ...shadowStyle
  },
  selectedOptionButton: {
    backgroundColor: '#6c5ce7',
    borderColor: '#6c5ce7'
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  letterCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f2f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  selectedLetterCircle: {
    backgroundColor: 'white'
  },
  optionLetter: {
    color: '#6c5ce7',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedOptionLetter: {
    color: '#6c5ce7'
  },
  optionText: {
    color: '#2d3436',
    fontSize: 16,
    flex: 1,
    fontWeight: '500'
  },
  selectedOptionText: {
    color: 'white'
  },
  score: {
    fontSize: 36,
    marginBottom: 10,
    color: '#2d3436',
    fontWeight: '800'
  },
  percentage: {
    fontSize: 18,
    color: '#636e72',
    marginBottom: 40
  },
  restartButton: {
    backgroundColor: '#00b894',
    padding: 18,
    borderRadius: 15,
    ...shadowStyle,
    width: '100%',
    maxWidth: 300,
    marginBottom: 15,
  },
  restartButtonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#6c5ce7',
  },
  secondaryButtonText: {
    color: '#6c5ce7',
  },
});
