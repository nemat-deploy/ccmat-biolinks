'use client'

import React from 'react'

function Fluxograma(){
    const handleImageOpen = ()=> {
        window.open("/images/fluxograma-matematica-ufdpar-1.jpg")
    }

    return (
        <main>
            <button onClick={handleImageOpen}>
                ABRIR COMO IMAGEM JPG
            </button>
            <button>
                BAIXAR EM PDF
            </button>
        </main>
    )
}

export default Fluxograma