'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import styles from './LinkButtom.module.css'

const LinkButton = ({ href, children }) => {
    const router = useRouter()

    const handleClick = () => {
        router.push(href)
    }
    return (
        <button onClick={handleClick} className={styles.button}>
            {children}
        </button>
    )
}

export default LinkButton