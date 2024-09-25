'use client'

import React from 'react'
import './Page.module.css'

function Fluxograma(){
    const handleImageOpen = ()=> {
        window.open("/images/fluxograma-matematica-ufdpar-1.jpg")
    }
    const handleImagePdf = ()=> {
        window.open("/images/fluxograma-matematica-ufdpar.pdf")
    }

    return (
        <div className='mainFluxograma'>
            <div className="options">
                <button className='btImage' onClick={handleImageOpen}>
                    ABRIR COMO IMAGEM JPG
                </button>
                <button className='btImage' onClick={handleImagePdf}>
                    BAIXAR EM PDF
                </button>
            </div>
        </div>
    )
}

export default Fluxograma