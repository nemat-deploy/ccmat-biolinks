'use client'

import React from 'react'
import { Poppins } from 'next/font/google'
import styles from './LinkButtom.module.css'

const poppins = Poppins({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-poppins',
})

const LinkButton = ({ href, target, children }) => {
    return (
        <a href={href} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined}>
            <button className={`${styles.button} ${poppins.className} ${poppins.variable}`}>
                {children}
            </button>
        </a>
    )
}

export default LinkButton