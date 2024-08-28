'use client'

import React from 'react'
import './Footer.modules.css'
import Image from 'next/image'

function Footer() {
    return (
        <div className='mainFooter'>

            <div className='footerInstagram'>

                <Image 
                    className='instagramLogo'
                    src='/images/instagram.png'
                    alt='Logo Instagram'
                    width={25}
                    height={25}
                />

                <Image 
                    className='logMail' 
                    src='/images/email.png' 
                    alt='Mail' 
                    width={43}
                    height={40}
                />

            </div>

        </div>
    )
}

export default Footer