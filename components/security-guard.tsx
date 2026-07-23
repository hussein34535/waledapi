"use client"

import { useEffect } from "react"

export default function SecurityGuard() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "C", "J"].includes(e.key)) ||
        (e.ctrlKey && e.key === "U")
      ) {
        e.preventDefault()
      }
    }

    const contextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    document.addEventListener("keydown", handler)
    document.addEventListener("contextmenu", contextMenu)

    return () => {
      document.removeEventListener("keydown", handler)
      document.removeEventListener("contextmenu", contextMenu)
    }
  }, [])

  return null
}
