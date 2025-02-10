import Link from 'next/link'

export default function Navigation() {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex space-x-7">
            <div className="flex items-center">
              <Link href="/" className="text-gray-800 text-xl font-bold">
                Dailo
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/create" className="text-gray-600 hover:text-blue-600">
                Generate Transcript
              </Link>
              <Link href="/transcript-formatter" className="text-gray-600 hover:text-gray-900">
                Transcript Formatter
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