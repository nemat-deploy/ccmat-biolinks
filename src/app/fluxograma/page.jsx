'use client'

import React from 'react'
import styles from './Page.module.css'

function Fluxograma(){
    const handleImageOpen = ()=> {
        window.open("/images/fluxograma-matematica-ufdpar-1.jpg")
    }
    const handleImagePdf = ()=> {
        window.open("/images/fluxograma-matematica-ufdpar.pdf")
    }

    return (
        <div className='mainFluxograma'>
            <div>
            </div>
            <div className="options">
                <h3>Fluxograma do Curso de Matemática - UFDPar</h3>
                <button className='btImage' onClick={handleImageOpen}>
                    BAIXAR COMO IMAGEM
                </button>
                <button className='btImage' onClick={handleImagePdf}>
                    BAIXAR EM PDF
                </button>
            </div>
        </div>
    )
}

export default Fluxograma