import Link from 'next/link'

export default function Navigation() {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex space-x-7">
            <div className="flex items-center">
              <Link href="/" className="text-gray-800 text-xl font-bold">
                AI Tools
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/pet-name" className="text-gray-600 hover:text-blue-600">
                Pet Name Generator
              </Link>
              <Link href="/text-to-speech" className="text-gray-600 hover:text-blue-600">
                Text to Speech
              </Link>
              <Link href="/transcript" className="text-gray-600 hover:text-blue-600">
                Transcript Player
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
} 