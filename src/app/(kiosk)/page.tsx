'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'
import Image from 'next/image'

const SLIDES = [
  {
    image: 'https://babe.com.my/wp-content/uploads/2025/04/nasi-ayam-penyet-recipe-smashed-fried-chicken-rice-1745379018.jpg',
    name: 'Paket Nasi Ayam Penyet',
    price: '16.000',
    desc: 'Lengkap dengan Tahu, Tempe, dan Sambal Khas'
  },
  {
    image: 'https://www.dapurkobe.co.id/wp-content/uploads/kulit-ayam-crispy-geprek.jpg',
    name: 'Ayam Geprek Krispi',
    price: '10.000',
    desc: 'Pedasnya Mantap, Ayamnya Gurih Pisan!'
  },
  {
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSNNPSFeqOUD08ZnRvZSZkxLo1hItkRvshq1w&s',
    name: 'Ayam Goreng Utuh',
    price: '35.000',
    desc: 'Satu Ekor Ayam Ungkep Spesial Kalintang'
  },
  {
    image: 'https://img-global.cpcdn.com/recipes/4650eb62c0c70a2f/680x781cq80/bacem-kepala-ayam-ala-angkringan-foto-resep-utama.jpg',
    name: 'Sate Kepala Ayam',
    price: '3.000',
    desc: 'Bumbu Ungkep Meresap Sampai ke Tulang'
  }
]

export default function AttractScreen() {
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    router.prefetch('/order-type')
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [router])

  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden cursor-pointer group"
      onClick={() => router.push('/order-type')}
    >
      {/* Background Slideshow */}
      {SLIDES.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
            }`}
        >
          {/* VIGNETTE OVERLAY: Menghitamkan pinggir & bawah agar teks menonjol */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-black/20 z-0" /> {/* Dimmer tambahan */}
          <Image
            src={slide.image}
            alt={slide.name}
            fill
            priority={index === 0}
            unoptimized
            className="object-cover"
          />
        </div>
      ))}

      {/* Floating Logo Overlay */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center animate-in fade-in slide-in-from-top duration-1000">
        <Image src="/logo-kalintang.png" alt="Logo" width={256} height={224} priority unoptimized className="h-28 md:h-36 lg:h-48 w-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-x-0 bottom-0 z-20 p-8 md:p-12 lg:p-16 flex flex-col items-center text-center space-y-6 md:space-y-8">

        <div className="space-y-2 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
          {/* TEXT SHADOW: Menambahkan bayangan hitam pada teks agar tidak nyaru */}
          <h2 className="text-brand-secondary text-5xl md:text-7xl font-black uppercase tracking-tighter drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
            {SLIDES[currentSlide].name}
          </h2>
          <div className="flex items-center justify-center gap-4">
            <div className="h-1 w-12 bg-brand-secondary rounded-full shadow-lg" />
            <p className="text-white text-2xl md:text-4xl font-black tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              Hanya Rp {SLIDES[currentSlide].price}
            </p>
            <div className="h-1 w-12 bg-brand-secondary rounded-full shadow-lg" />
          </div>
          <p className="text-white/90 text-lg md:text-xl font-bold italic drop-shadow-md">
            &quot;{SLIDES[currentSlide].desc}&quot;
          </p>
        </div>

        {/* Pulsing Start Button - BLUE THEME */}
        <div className="pt-8">
          <Button
            className="h-24 px-16 rounded-full bg-brand-primary text-brand-secondary text-3xl font-black shadow-[0_20px_60px_rgba(6,103,172,0.6)] hover:scale-105 active:scale-95 transition-all animate-pulse flex items-center gap-4 border-4 border-brand-secondary/20"
          >
            SENTUH UNTUK MEMULAI
            <ChevronRight size={40} className="stroke-[4]" />
          </Button>
        </div>

        {/* Slide Indicators */}
        <div className="flex gap-3 pt-4">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-500 shadow-md ${i === currentSlide ? 'w-12 bg-brand-secondary' : 'w-2 bg-white/30'
                }`}
            />
          ))}
        </div>

        <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.6em] pt-4 drop-shadow-md">
          Ayam Kalintang • Kiosk Terminal #01
        </p>
      </div>

      {/* Legal & Contact Footer for Midtrans Compliance */}
      <div
        className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-sm z-30 py-3 px-6 flex flex-col md:flex-row justify-between items-center text-white/80 text-xs border-t border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1 items-center md:items-start">
          <div className="flex gap-4 items-center">
            <p className="font-semibold text-white/90">Ayam Kalintang</p>
            <span className="hidden md:inline">•</span>
            <p>cs@ayamkalintang.com</p>
            <span className="hidden md:inline">•</span>
            <p>WA: +62 895-6021-21652</p>
          </div>
          <div className="text-[10px] text-white/50 flex items-center gap-2">
            <span>Secured by Midtrans</span>
            <span>•</span>
            <span>Pembayaran: QRIS, GoPay, OVO, ShopeePay, Dana, LinkAja</span>
          </div>
        </div>
        <div className="flex gap-6 mt-3 md:mt-0">
          <a href="/tnc" className="hover:text-white transition-colors underline underline-offset-2">Syarat & Ketentuan</a>
          <a href="/privacy-policy" className="hover:text-white transition-colors underline underline-offset-2">Kebijakan Privasi</a>
        </div>
      </div>
    </div>
  )
}
