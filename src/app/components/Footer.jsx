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
                    width={45}
                    height={45}
                />
            </a>

            <a href='https://instagram.com/laef.ufdpar' target='_blank'>
                <Image 
                    className='instagramLogo'
                    src='/images/logo-instagram.svg'
                    alt='Logo Instagram'
                    width={45}
                    height={45}
                />
            </a>


        </div>
    )
}

export default Footer