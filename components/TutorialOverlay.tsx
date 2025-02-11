import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, PanResponder, PanResponderGestureState, Pressable, ViewStyle } from 'react-native';
import { useTheme } from "@/contexts/ThemeContext";

import Ionicons from '@expo/vector-icons/Ionicons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

type TutorialOverlayProps = {
  isVisible: boolean;
  onClose: () => void;
};

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ isVisible, onClose }) => {
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const currentPageRef = useRef<number>(currentPage);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const position = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        position.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState: PanResponderGestureState) => {
        if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD) {
          if (gestureState.dx > 0 && currentPageRef.current > 0) {
            animateToPage(currentPageRef.current - 1);
          } else if (gestureState.dx < 0 && currentPageRef.current < 2) {
            animateToPage(currentPageRef.current + 1);
          } else {
            resetPosition();
          }
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const animateToPage = (newPage: number) => {
    const direction = newPage > currentPageRef.current ? 1 : -1;
    Animated.spring(position, {
      toValue: -direction * SCREEN_WIDTH,
      useNativeDriver: true,
    }).start(() => {
      setCurrentPage(newPage);
      position.setValue(0);
      currentPageRef.current = newPage;
    });
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();

      setCurrentPage(0);
      position.setValue(0);
      currentPageRef.current = 0;
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {[0, 1, 2].map(index => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: currentPage === index ? theme.accentColor : theme.textColor,
              opacity: currentPage === index ? 1 : 0.5,
            },
          ]}
        />
      ))}
    </View>
  );

  const renderContent = () => {
    position.setValue(0);
    switch (currentPage) {
      case 0:
        return (
            <View style={[styles.modal, styles.contentContainer, { backgroundColor: theme.backgroundColor, alignContent: 'center' }]}>
              <Text style={[styles.text, { color: theme.textColor }]}>
                Glad you're here! Let's do a brief overview of the game board.
              </Text>
              {renderNavigationButtons()}
              {renderDots()}
            </View>
        );
      case 1:
        return (
          <>
             <View style={[styles.gridHighlight, {marginBottom: 10 }]}>
              <Ionicons name="arrow-up-outline" color="yellow" size={90} />
            </View>
            <View style={[styles.modal, styles.contentContainer, { backgroundColor: theme.backgroundColor }]}>
              <Text style={[styles.text, { color: theme.textColor }]}>
                This is the "grid". You will intermittently see blocks appear in random order on this part.
              </Text>
              {renderNavigationButtons()}
              {renderDots()}
            </View>
          </>
        );
      case 2:
        return (
          <>
            <View style={[styles.modal, styles.contentContainer, { backgroundColor: theme.backgroundColor }]}>
              <Text style={[styles.text, { color: theme.textColor }]}>
                These are your controls. They give you status updates and one or more buttons for play. If you see something you want to react to, these are the buttons you press. When you're ready to begin, just tap "Play".
              </Text>
              {renderNavigationButtons()}
              {renderDots()}
            </View>
            <View style={[styles.buttonHighlight, { alignSelf: 'center', alignItems: 'center', marginTop: 30 }]}>
              <Ionicons name="arrow-down-outline" color="yellow" size={90} />
            </View>
          </>
        );
    }
  };

  const renderNavigationButtons = () => (
    <View style={styles.navigationContainer}>
      {currentPage > 0 && (
        <Pressable
          onPress={() => animateToPage(currentPage - 1)}
          style={[styles.navButton, { backgroundColor: theme.accentColor }]}
        >
          <Text style={[styles.navButtonText, { color: theme.textColor }]}>Previous</Text>
        </Pressable>
      )}
      {currentPage < 2 && (
        <Pressable
          onPress={() => animateToPage(currentPage + 1)}
          style={[styles.navButton, { backgroundColor: theme.accentColor }]}
        >
          <Text style={[styles.navButtonText, { color: theme.textColor }]}>Next</Text>
        </Pressable>
      )}
      {currentPage === 2 && (
        <Pressable
          onPress={onClose}
          style={[styles.navButton, { backgroundColor: theme.accentColor }]}
        >
          <Text style={[styles.navButtonText, { color: theme.textColor }]}>Got it!</Text>
        </Pressable>
      )}
    </View>
  );

  const computedStyles = (): ViewStyle => {
    if (currentPage === 2) return styles.highContainer
    else if (currentPage === 1) return styles.lowContainer;
    else return styles.container
  }

  return (
    <View style={computedStyles()}>
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity,
            backgroundColor: theme.backgroundColor,
          }
        ]}
      />
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          {
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [600, 0],
                }),
              },
              {
                translateX: position,
              },
            ],
            // backgroundColor: theme.backgroundColor,
          },
        ]}
      >
        {renderContent()}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lowContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    marginBottom: 20,
    alignItems: 'center',
  },
  highContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modal: {
    width: '90%',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  text: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  gridHighlight: {
    margin: 'auto',
    minWidth: 200,
    alignItems: 'center',
    // borderWidth: 4,
    // borderColor: 'yellow',
    // borderRadius: 100,
    paddingTop: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonHighlight: {
    width: 200,
    // borderWidth: 4,
    // borderColor: 'yellow',
    // borderRadius: 100,
    paddingBottom: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  navButton: {
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
    marginLeft: 10,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TutorialOverlay;