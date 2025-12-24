"use client";

import { useEffect, useRef, useState } from "react";
import { RealtimeAgent, RealtimeSession } from "@openai/agents/realtime";
import { Loader } from "./Loader";
import ChatMessages from "./ChatMessages";
import VoiceVolumeMeter from "./VoiceVolumeMeter";
import { getPdf } from "../agent/tools/pdf-tool";
import { voldemortGuardrails } from "../agent/guardrails/voldemort";
import { MessageItem } from "../types/realTimeAgent";

export default function VoiceRealtimeAgent() {
  const [session, setSession] = useState<RealtimeSession | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isTooling, setIsTooling] = useState(false);
  const sessionRef = useRef<RealtimeSession | null>(null);
  const [messageHistory, setMessageHistory] = useState<MessageItem[]>();

  const connect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/realtime-agent");
      const { clientSecret } = await res.json();

      const agent = new RealtimeAgent({
        name: "PDF Assistant",
        instructions: `
        You have access to a PDF search tool. 
        When you receive results from get_pdf, use that information to formulate your verbal response. 
        If the information is missing, state "No information in PDF." 
        Do NOT talk about other things or connect to anything outside the PDF files.
        Every answer must rely solely on the content of the PDF.
         `,
        tools: [getPdf],
      });

      const realtimeSession = new RealtimeSession(agent, {
        model: "gpt-realtime",
        outputGuardrails: voldemortGuardrails,
        config: {
          inputAudioFormat: "pcm16",
          outputAudioFormat: "pcm16",
          inputAudioTranscription: {
            model: "gpt-4o-mini-transcribe",
          },
        },
      });
      await realtimeSession.connect({ apiKey: clientSecret });

      realtimeSession.on("history_updated", (history) => {
        console.log("history", history);
        setMessageHistory(history as MessageItem[]);
      });
      realtimeSession.on("agent_tool_start", (res) => {
        if (res) {
          console.log("AI agent_tool_start ");
          setIsTooling(true);
        }
      });
      realtimeSession.on("agent_tool_end", (res) => {
        if (res) {
          console.log("AI agent_tool_end ");
          setTimeout(() => {
            setIsTooling(false);
          }, 2000);
        }
      });
      realtimeSession.on("agent_start", (res) => {
        if (res) {
          console.log("AI agent_start speaking");
          setIsThinking(true);
        }
      });

      realtimeSession.on("agent_end", (res) => {
        if (res) {
          console.log("AI agent_end speaking");
          setIsThinking(false);
        }
      });

      sessionRef.current = realtimeSession;
      setSession(realtimeSession);

      console.log("Connected to Realtime Agent");
    } catch (err) {
      console.error("Failed to connect", err);
    } finally {
      setConnecting(false);
    }
  };
  const stop = () => {
    if (!sessionRef.current) return;

    sessionRef.current.close();
    setMessageHistory(undefined);
    sessionRef.current = null;
    setSession(null);

    console.log("Session cleared");
  };
  useEffect(() => {
    return () => {
      sessionRef.current?.close();
      sessionRef.current = null;
    };
  }, []);

  return (
    <div className="sm:p-8 p-4 border border-gray-200 rounded-3xl sm:w-2/3 sm:m-0 m-2    space-y-8 bg-white shadow-2xl backdrop-blur-sm bg-opacity-80">
      <div className="flex items-center justify-between">
        <h2 className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">
          Realtime AI Agent
        </h2>
        <div
          className={`h-3 w-3 rounded-full ${
            session ? "bg-green-500 animate-pulse" : "bg-gray-300"
          }`}
        />
      </div>
      <div className="w-full sm:p-5 bg-white/30 backdrop-blur-md sm:border border-white/20 rounded-3xl shadow-xl ring-1 ring-black/5">
        {session && messageHistory && messageHistory.length > 0 ? (
          messageHistory && <ChatMessages messages={messageHistory} />
        ) : (
          <p className="mt-2 text-gray-700">
            I’m an advanced AI agent designed to respond instantly. Talk to me
            like a human I’ll handle the intelligence.
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <VoiceVolumeMeter isSession={!!session} />

        <span className="text-sm font-medium">
          {session && !isThinking
            ? "Agent Active"
            : isThinking
            ? "Agent thinking"
            : "Agent waiting"}
          {}
        </span>
      </div>
      <div>{isTooling && <Loader />}</div>
      {!session ? (
        <button
          onClick={connect}
          disabled={connecting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-200 flex items-center justify-center gap-3"
        >
          {connecting ? (
            <span className="animate-spin border-2 border-white border-t-transparent rounded-full h-5 w-5" />
          ) : (
            "Start Voice Chat"
          )}
        </button>
      ) : (
        <div className="space-y-6">
          <button
            onClick={stop}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-4 px-6 rounded-2xl border border-red-200 transition-colors shadow-sm"
          >
            Stop Session
          </button>
        </div>
      )}
    </div>
  );
}
