'use client'

import React from 'react'
import './Footer.modules.css'
import Image from 'next/image'

function Footer() {
    return (
        <div className='mainFooter'>

            <a href='mailto:laefufdpar@gmail.com' target='_blank'>
                <Image 
                    className='emailLogo' 
                    src='/images/logo-email.svg' 
                    alt='Mail' 
                    width={42}
                    height={40}
                />
            </a>

            <a href='https://instagram.com/laef.ufdpar' target='_blank'>
                <Image 
                    className='instagramLogo'
                    src='/images/logo-instagram.svg'
                    alt='Logo Instagram'
                    width={40}
                    height={40}
                />
            </a>


        </div>
    )
}

export default Footer