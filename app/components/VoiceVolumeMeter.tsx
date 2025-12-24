// components/VoiceVolumeMeter.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";

interface VoiceVolumeMeterProps {
  active?: boolean;
  isSession: boolean;
}

const VoiceVolumeMeter: React.FC<VoiceVolumeMeterProps> = ({
  active = true,
  isSession,
}) => {
  const [volume, setVolume] = useState(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;

    const setupAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateVolume = () => {
          if (!analyserRef.current) return;

          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setVolume(Math.min(1, avg / 128));

          animationFrameRef.current = requestAnimationFrame(updateVolume);
        };

        updateVolume();
      } catch (err) {
        console.error("Cannot access microphone:", err);
      }
    };

    setupAudio();

    return () => {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      if (analyserRef.current) analyserRef.current.disconnect();
    };
  }, [active]);
  return (
    <div className="flex gap-2 justify-center items-end   ">
      {isSession ? (
        <div
          className="w-5 h-5 rounded-full shadow-sm bg-green-500"
          style={{
            opacity: 0.2 + volume * 0.8,
            transform: `scale(${1 + volume * 1.5})`,
            transition:
              "height 0.1s ease, box-shadow 0.1s ease, opacity 0.1s ease",
          }}
        />
      ) : (
        <div className={`h-4 w-4 rounded-full opacity-50 bg-blue-500 `}></div>
      )}
    </div>
  );
};

export default VoiceVolumeMeter;
