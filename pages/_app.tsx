import '../styles/globals.css'
import type {AppProps} from 'next/app'
import {Layout} from "../components/Layout";
import {useRouter} from "next/router";
import {useEffect} from "react";

import * as gtag from '../lib/gtag'
function MyApp({Component, pageProps}: AppProps) {
  const router = useRouter()
  useEffect(() => {
    const handleRouteChange = (url:string) => {
      gtag.pageview(url)
    }
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])
  return (
      <>

        <Layout>
          <Component {...pageProps} />
        </Layout>
      </>

  )
}

export default MyApp
