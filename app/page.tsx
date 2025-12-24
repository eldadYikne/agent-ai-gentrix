import VoiceRealtimeAgent from "./components/VoiceRealtimeAgent";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <VoiceRealtimeAgent />
    </div>
  );
}
