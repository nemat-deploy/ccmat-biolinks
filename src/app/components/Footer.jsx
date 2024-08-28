'use client'

import React from 'react'
import './Footer.modules.css'
import Image from 'next/image'

function Footer() {
    return (
        <div className='mainFooter'>

            <a href="mailto:laefufdpar@gmail.com">
                <Image 
                    className='emailLogo' 
                    src='/images/email-bck.png' 
                    alt='Mail' 
                    width={42}
                    height={40}
                />
            </a>

            <a href="https://instagram.com/laef.ufdpar">
                <Image 
                    className='instagramLogo'
                    src='/images/instagram-bck.png'
                    alt='Logo Instagram'
                    width={40}
                    height={40}
                />
            </a>


        </div>
    )
}

export default Footer