import React, { useState, useEffect, useRef } from "react";
import { View } from "react-native";
import { useFocusEffect, useNavigation } from "expo-router";
import { Audio } from "expo-av";

import Square from "@/components/Square";
import Button from "@/components/Button";
import StatusButton from "@/components/StatusButton";

import security from "@/util/security";

import engine, { getDualMode, fillBoard, SoundState, CustomTimer, loadSounds, RunningEngine, loadSound, Grid } from "@/util/engine";

import { getGlobalStyles } from "@/styles/globalStyles";

export default function Play() {
  console.debug("RENDERED PLAY");

  const styles = getGlobalStyles();
  const navigation = useNavigation();

  const [grid, setGrid] = useState<Grid>(fillBoard());
  useEffect(() => { console.log("because of Play hook 1: grid") }, [grid]);

  const [shouldStartGame, startGame] = useState<boolean>(false);
  useEffect(() => { console.log("because of Play hook 2: shouldStartGame") }, [shouldStartGame]);

  const [elapsedTime, setElapsedTime] = useState<number>(-1);
  useEffect(() => { console.log("because of Play hook 3: elapsedTime") }, [elapsedTime]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  useEffect(() => { console.log("because of Play hook 4: isLoading") }, [isLoading]);

  const [defaultN, setDefaultN] = useState<number>();
  useEffect(() => { console.log("because of Play hook 5: defaultN") }, [defaultN]);

  const gameLoopRef = useRef<CustomTimer>(null);
  const engineRef = useRef<RunningEngine>();


  // Is Dual N-Back Mode
  const isDualMode = useRef<boolean>(false);
  const setDualMode = (p: boolean) => {
    isDualMode.current = p;
  }

  // All Sounds
  const sounds = useRef<SoundState>({});
  const setSounds = (p: SoundState) => {
    sounds.current = p;
  }
  type sound = Audio.Sound | null;
  const sound = useRef<sound>(null);
  const setSound = (p: sound) => {
    sound.current = p;
  }

  // TODO Tracking Score
  const clickRef = useRef(0);
  const setClickRef = (fn: (p: number) => number) => {
    clickRef.current = fn(clickRef.current);
  }

  // Current N
  const getN = async (): Promise<number> => {
    try {
      const n = await security.get("defaultN");
      return n as number
    } catch (e) {
      console.error("Error in [getN]", e);
      throw e;
    }
  };

  const resetGame = () => {
    stopGameLoop();
    startGame(false);
    setElapsedTime(-1);
    setGrid(fillBoard());
  }

  const startGameLoop = () => {
    if (!gameLoopRef.current) {
      gameLoopRef.current = setInterval(() => {
        setElapsedTime((p) => p + 1);
      }, 1000);
    }
  }

  const stopGameLoop = () => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }

  // Main Gameplay Loop
  useFocusEffect(
    React.useCallback(() => {
      const initGame = async () => {
        // TODO these should be variable per game
        const len = 30
        const matchRate = 0.3

        try {
          const n: number = await getN();

          navigation.setOptions({
            title: `Play (${n}-back)`,
          });
          setDefaultN(n);

          const isDualMode: boolean = await getDualMode();
          setDualMode(isDualMode);

          // TODO prob move this to the engine?
          if (isDualMode) {
            const sounds = await loadSounds();
            setSounds(sounds);

          } else {
            const sound = await loadSound();
            setSound(sound);
          }

          engineRef.current = engine({
            n,
            gameLen: len,
            matchRate,
            isDualMode
          });

          engineRef.current.createNewGame();
          startGame(true);
        } catch (e) {
          console.error("Error initializing game.", e);
        }
      }

      initGame();

      return () => {
        resetGame()
      } // Cleanup on unmount
    }, [/* first run: initialize game */])
  );

  useEffect(() => {
    if (shouldStartGame) {
      startGameLoop();
      setIsLoading(false);

      return () => {
        stopGameLoop();
      }
    }
  }, [shouldStartGame]);

  useEffect(() => {
    if (elapsedTime >= 0) {
      if (elapsedTime % 2 === 0) {
        try {
          const round = engineRef.current?.nextRound(elapsedTime);
          setGrid(round?.next as Grid);
          round?.playSound()
        } catch (e) {
          console.log("Error in game. Ejecting.", e);
          resetGame();
        }
      }
    }
  }, [elapsedTime])

  // Cleanup
  useEffect(() => {
    const unloadSounds = () => {
      if (sounds.current !== null) {
        Object.values(sounds).forEach(({ current }) => {
          if (current) current.unloadAsync();
        });
      }

      if (sound.current !== null) {
        sound.current.unloadAsync();
      }
    }

    return () => { // Cleanup on unmount
      unloadSounds();
      resetGame();
    };
  }, []);

  // TODO game has no end condition

  return (
    <View style={styles.container}>
      {grid.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((isActive: boolean, colIndex: number) => (
            <View key={`cell-${rowIndex}-${colIndex}`} style={styles.cell}>
              {isActive &&
                (<Square key={`cell-${rowIndex}-${colIndex}`} />)
              }
              {!isActive &&
                (<View style={styles.placeHolder} />)
              }
            </View>
          ))}
        </View>
      ))}
      { /* TODO: buttons need visual feedback. */ }
      <View style={[styles.row, { marginTop: 20 }]}>
        <View style={[styles.cell, styles.clearBorder]}>
          <Button label=" Sound " onPress={() => alert(clickRef.current)} />
        </View>
        <View style={[styles.cell, styles.clearBorder]}>
          <Button label=" Position " onPress={() => setClickRef((prev) => prev + 1)} />
        </View>
      </View>
      <StatusButton onPress={resetGame} isLoading={isLoading} playing={shouldStartGame} />
    </View>
  );
}
