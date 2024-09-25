'use client'

import React from 'react'
import styles from './LinkButtom.module.css'

const LinkButton = ({ href, target, children }) => {
    return (
        <a href={href} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined}>
            <button className={styles.button}>
                {children}
            </button>
        </a>
    )
}

export default LinkButton