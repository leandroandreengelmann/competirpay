"use client";

import Link from "next/link";
import { ArrowRight, CreditCard, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicFooter } from "@/components/PublicFooter";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-zinc-950 selection:bg-primary/20 selection:text-primary dark:bg-black dark:text-white">
      <main className="flex-1">
        {/* Navigation (Minimalist) */}
        <nav className="flex items-center justify-between p-6 sm:p-12 lg:px-16 absolute top-0 w-full z-50">
          <div className="text-2xl font-black tracking-tighter uppercase">
            competir<span className="text-primary">.pay</span>
          </div>
        </nav>

        {/* Hero Section: Swiss Punk / Brutalist Style */}
        <section className="relative min-h-[80vh] sm:min-h-screen flex flex-col justify-center sm:justify-end p-6 sm:p-12 lg:p-16 overflow-hidden pt-24 sm:pt-32">
          {/* Noise texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
          />

          {/* Gradient Background Element */}
          <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[10s]" />

          <div className="relative z-10 w-full">
            {/* Staggered Title */}
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-[clamp(3rem,8vw,7rem)] font-black leading-none tracking-tighter uppercase">
                Competir <br />
                <span className="text-primary italic">sem</span> <br />
                Limites.
              </h1>
            </motion.div>

            <div className="mt-6 sm:mt-12 flex flex-col lg:flex-row lg:items-end justify-between gap-6 lg:gap-12">
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-xl"
              >
                <p className="text-lg sm:text-2xl text-zinc-500 font-medium leading-relaxed dark:text-zinc-400">
                  A solução definitiva para atletas e organizadores. Crédito imediato, parcelamento flexível e a segurança que sua competição merece.
                </p>

                <div className="mt-6 sm:mt-10 flex flex-wrap gap-4">
                  <Link href="/solicitar-credito">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Button
                        size="lg"
                        className="group font-bold h-16 px-10 text-lg rounded-xl"
                      >
                        Solicitar Crédito Agora
                        <ArrowRight className="ml-2 size-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="hidden lg:block"
              >
                <div className="text-[10rem] font-black text-zinc-50 leading-[1] select-none dark:text-zinc-900/40">
                  01
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section: Kinetic Layering */}
        <section className="py-24 sm:py-40 px-6 sm:px-12 lg:px-16 bg-white dark:bg-zinc-950 relative overflow-hidden">
          {/* Background Decorative Type */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pointer-events-none overflow-hidden select-none">
            <span className="text-[15vw] font-black text-primary/[0.03] dark:text-primary/[0.05] whitespace-nowrap leading-none tracking-tighter">
              AÇÃO • PERFORMANCE
            </span>
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="mb-16 sm:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8">
              <div className="max-w-2xl">
                <h2 className="text-xs font-black uppercase tracking-[0.5em] text-primary mb-4 sm:mb-6 flex items-center gap-2">
                  <span className="w-8 h-[2px] bg-primary" />
                  Porque nós?
                </h2>
                <h3 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase leading-tight">
                  Inovação no <br />
                  <span className="text-primary italic">campo</span> financeiro.
                </h3>
              </div>
              <p className="text-zinc-500 font-medium max-w-sm mb-2 dark:text-zinc-400 text-sm sm:text-base">
                Quebramos paradigmas para que você foque apenas na linha de chegada.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 pt-12">
              {/* Feature 1: Staggered Up */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative group md:-translate-y-12"
              >
                <div className="absolute inset-0 bg-primary/10 translate-x-3 translate-y-3 sm:translate-x-4 sm:translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500 rounded-2xl" />
                <div className="relative p-8 sm:p-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 h-full group-hover:border-primary transition-colors duration-500 rounded-2xl">
                  <Zap className="size-12 sm:size-16 mb-8 sm:mb-12 text-zinc-900 dark:text-white group-hover:text-primary transition-colors duration-500" />
                  <h4 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-4 sm:mb-6">Aprovação <br />Veloz</h4>
                  <p className="text-zinc-500 text-sm sm:text-base leading-relaxed font-bold dark:text-zinc-400">Receba sua resposta em tempo recorde. Não deixe sua inscrição para depois.</p>
                </div>
              </motion.div>

              {/* Feature 2: Standard Center */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-primary/10 -translate-x-3 translate-y-3 sm:-translate-x-4 sm:translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500 rounded-2xl" />
                <div className="relative p-8 sm:p-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 h-full group-hover:border-primary transition-colors duration-500 rounded-2xl">
                  <CreditCard className="size-12 sm:size-16 mb-8 sm:mb-12 text-zinc-900 dark:text-white group-hover:text-primary transition-colors duration-500" />
                  <h4 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-4 sm:mb-6">Inscrições <br />Parceladas</h4>
                  <p className="text-zinc-500 text-sm sm:text-base leading-relaxed font-bold dark:text-zinc-400">Parcele em até 10x no cartão ou em até 7x através de boleto bancário.</p>
                </div>
              </motion.div>

              {/* Feature 3: Staggered Down */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative group md:translate-y-12"
              >
                <div className="absolute inset-0 bg-primary/10 translate-x-3 -translate-y-3 sm:translate-x-4 sm:-translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500 rounded-2xl" />
                <div className="relative p-8 sm:p-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 h-full group-hover:border-primary transition-colors duration-500 rounded-2xl">
                  <ShieldCheck className="size-12 sm:size-16 mb-8 sm:mb-12 text-zinc-900 dark:text-white group-hover:text-primary transition-colors duration-500" />
                  <h4 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-4 sm:mb-6">Total <br />Segurança</h4>
                  <p className="text-zinc-500 text-sm sm:text-base leading-relaxed font-bold dark:text-zinc-400">Processamento seguro e transparente. Seus dados e seu crédito em boas mãos.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Call to Action: Extreme Asymmetry */}
        <section className="py-24 sm:py-40 px-6 sm:px-12 lg:px-16 overflow-hidden relative">
          <div className="absolute inset-0 bg-primary translate-y-[90%] scale-x-[200%] rotate-2 opacity-5" />

          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 sm:gap-16">
            <div className="w-full lg:w-1/2 text-center sm:text-left">
              <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter leading-tight mb-6 sm:mb-8">Pronto para <br /> a vitória?</h2>
              <p className="text-lg sm:text-xl text-zinc-500 dark:text-zinc-400 font-medium max-w-md mx-auto sm:mx-0">
                Junte-se a outros atletas que já utilizam a competir.pay para focar apenas no que importa: o pódio.
              </p>
            </div>

            <div className="w-full lg:w-1/2 flex justify-start lg:justify-end">
              <Link href="/solicitar-credito" className="w-full sm:w-auto">
                <motion.div
                  whileHover={{ x: 10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-10 h-16 font-bold text-lg rounded-xl"
                  >
                    Começar Agora
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
