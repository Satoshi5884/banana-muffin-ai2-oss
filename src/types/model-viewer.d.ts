import type React from 'react'

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
          src?: string
          alt?: string
          'camera-controls'?: boolean | ''
          autoplay?: boolean | ''
          'shadow-intensity'?: string | number
          style?: React.CSSProperties
        }
      }
    }
  }
}
