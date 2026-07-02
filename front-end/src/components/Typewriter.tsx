import { useEffect, useState } from 'react'

interface TypewriterProps {
  text: string
  speed?: number
  eraseSpeed?: number
  delay?: number
  pauseDuration?: number
}

export function Typewriter({
  text,
  speed = 100, // Slower typing speed (default 100ms per char)
  eraseSpeed = 50, // Erasing speed (50ms per char)
  delay = 800, // Pause duration when empty
  pauseDuration = 2500, // Pause duration when fully typed
}: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [index, setIndex] = useState(0)

  // Reset typewriter state when text changes (e.g., language toggled)
  useEffect(() => {
    setDisplayedText('')
    setIsDeleting(false)
    setIndex(0)
  }, [text])

  useEffect(() => {
    let timer: number

    // If at start, wait for initial delay before typing first letter
    if (index === 0 && displayedText === '' && !isDeleting) {
      timer = window.setTimeout(() => {
        if (text.length > 0) {
          setDisplayedText(text[0])
          setIndex(1)
        }
      }, delay)
      return () => clearTimeout(timer)
    }

    if (!isDeleting && index < text.length) {
      // Type next character
      timer = window.setTimeout(() => {
        setDisplayedText(text.slice(0, index + 1))
        setIndex((prev) => prev + 1)
      }, speed)
    } else if (!isDeleting && index === text.length) {
      // Finished typing: pause before starting to erase
      timer = window.setTimeout(() => {
        setIsDeleting(true)
      }, pauseDuration)
    } else if (isDeleting && index > 0) {
      // Erase character
      timer = window.setTimeout(() => {
        setDisplayedText(text.slice(0, index - 1))
        setIndex((prev) => prev - 1)
      }, eraseSpeed)
    } else if (isDeleting && index === 0) {
      // Finished erasing: pause before typing again
      timer = window.setTimeout(() => {
        setIsDeleting(false)
      }, delay)
    }

    return () => clearTimeout(timer)
  }, [text, index, isDeleting, speed, eraseSpeed, delay, pauseDuration, displayedText])

  return (
    <span className="relative">
      {displayedText}
      <span className="inline-block w-[3px] h-[1.1em] ml-1 bg-primary align-middle animate-pulse" aria-hidden="true" />
    </span>
  )
}
