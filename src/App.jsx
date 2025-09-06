import { useState } from 'react'
import Hero from './components/Hero'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <h1 className='text-center text-3xl font-bold mt-8 text-teal-600'>SpeakWise</h1>
     <Hero/>
     
    </>
  )
}

export default App
