import { useRef, useState } from 'react'
import reactLogo from './assets/react.svg'
import './index.css'

function App() {
  const [image, setImage] = useState<Blob | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);


  return (
    <div className="w-full h-screen bg-black flex flex-row">
      <canvas ref={canvasRef} className='w-10/12 h-full border border-gray-500'></canvas>
    </div>
  )
}

export default App
