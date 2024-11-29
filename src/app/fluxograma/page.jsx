'use client'

import React from 'react'
import styles from './Page.module.css'

function Fluxograma(){
    const handleImageOpen = ()=> {
        window.open("/docs/pre-requisitos-2021.pdf")
    }
    const handleResumidoPdf = ()=> {
        window.open("/docs/fluxograma-resumido.pdf")
    }
    const handleCompletoPdf = ()=> {
        window.open("/docs/fluxograma-matematica-ufdpar.pdf")
    }

    return (
        <div className='mainFluxograma'>
            <div>
            </div>
            <div className="options">
                <h3>Fluxograma do Curso de Matemática - UFDPar</h3>
                <button className='btImage' onClick={handleImageOpen}>
                    Pre-requisitos
                </button>

                <button className='btImage' onClick={handleResumidoPdf}>
                    Fluxograma Resumido
                </button>

                <button className='btImage' onClick={handleCompletoPdf}>
                    Fluxograma Completo
                </button>

            </div>
        </div>
    )
}

export default Fluxograma