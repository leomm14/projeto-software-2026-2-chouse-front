import { useEffect, useRef } from 'react'
import Icon from './Icon'
export default function Modal({ title, onClose, children }) {
  const dialog = useRef(null)
  useEffect(() => {
    const element = dialog.current
    const previous = document.activeElement
    element.showModal()
    return () => { element.close(); previous?.focus() }
  }, [])
  return <dialog ref={dialog} className="modal" aria-labelledby="modal-title" onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="modal-top"><span className="eyebrow">CHOUSE · ESCOLHA SEU LADO</span><button className="icon-button" onClick={onClose} aria-label="Fechar"><Icon name="close" /></button></div>
    <h2 id="modal-title">{title}</h2>{children}
  </dialog>
}
