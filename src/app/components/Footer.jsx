'use client'

import React from 'react'
import './Footer.modules.css'
import Image from 'next/image'

function Footer() {
    return (
        <div className='mainFooter'>

            <div className='footerInstagram'>

                <Image 
                    className='emailLogo' 
                    src='/images/email-black.png' 
                    alt='Mail' 
                    width={40}
                    height={40}
                />

                <Image 
                    className='instagramLogo'
                    src='/images/instagram-black.png'
                    alt='Logo Instagram'
                    width={41}
                    height={41}
                />

            </div>

        </div>
    )
}

export default Footer