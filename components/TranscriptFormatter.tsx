import { useState, ChangeEvent } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { transcriptFormatPrompt } from '@/prompts/transcriptFormatPrompt'
import { useOpenAI } from '@/hooks/useOpenAI'
import type { Transcript } from '@/types/transcript'

export default function TranscriptFormatter() {
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const { result, loading, error, generateResponse } = useOpenAI<Transcript>()

  const formatTranscript = async () => {
    if (!title.trim() || !text.trim()) {
      return
    }

    const prompt = {
      ...transcriptFormatPrompt,
      userPrompt: transcriptFormatPrompt.userPrompt(title, text)
    }

    await generateResponse(prompt)
  }

  const handleSave = async () => {
    if (!result) return;
    
    try {
      const response = await fetch('/api/transcripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      });

      if (!response.ok) {
        throw new Error('Failed to save transcript');
      }

      setSaveMessage('Transcript saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveMessage('Failed to save transcript');
      console.error('Error saving transcript:', err);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-center">Transcript Formatter</CardTitle>
        <CardDescription className="text-center">
          Enter a conversation title and text to format it into a structured transcript
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); formatTranscript(); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Conversation Title</Label>
            <Input
              id="title"
              placeholder="e.g., Coffee Shop Discussion"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="text">Conversation Text</Label>
            <Textarea
              id="text"
              placeholder="Paste your conversation text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[200px] w-full"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Formatting...' : 'Format Transcript'}
          </Button>
        </form>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">{result.title}</h3>
              <div className="flex items-center gap-2">
                {saveMessage && (
                  <span className="text-green-600 text-sm">{saveMessage}</span>
                )}
                <Button
                  onClick={handleSave}
                  variant="outline"
                  size="sm"
                >
                  Save Transcript
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600">Transcript ID: {result.id}</p>
            <div className="space-y-2">
              {result.dialogue.map((line, index) => {
                const speaker = result.speakers.find(s => s.id === line.speakerId);
                return (
                  <div key={index} className="text-gray-800">
                    <span className="font-semibold">{speaker?.name}: </span>
                    {line.text}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 