'use client';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Dailo Podcast Generator</h1>
      <p className="text-xl text-gray-600 text-center max-w-2xl">
        Transform your ideas into engaging podcast-style conversations using AI voices. 
        Create, format, and generate natural-sounding dialogues with ease.
      </p>
      <div className="mt-8 space-y-4 text-center">
        <h2 className="text-2xl font-semibold">Features:</h2>
        <ul className="space-y-2 text-lg text-gray-700">
          <li>✍️ Format raw text into structured dialogues</li>
          <li>🎙️ Convert text to natural AI voices</li>
          <li>🎧 Generate complete podcast episodes</li>
          <li>📚 Manage your podcast library</li>
        </ul>
      </div>
    </main>
  );
}