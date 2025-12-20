import { Router, Route, Switch } from 'wouter'
import Home from './pages/Home'
import Product from './pages/Product'
import Pricing from './pages/Pricing'
import Security from './pages/Security'
import Feedback from './pages/Feedback'
import About from './pages/About'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import { Navbar, Footer } from './components/Shared'
import { useEffect } from 'react'

// Scroll to top on route change
const ScrollToTop = () => {
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])
    return null
}

const App = () => {
    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark selection:bg-primary/30 selection:text-white overflow-x-hidden flex flex-col">
            <Navbar />

            <div className="flex-grow pt-16">
                <Switch>
                    <Route path="/">
                        <>
                            <ScrollToTop />
                            <Home />
                        </>
                    </Route>
                    <Route path="/product">
                        <>
                            <ScrollToTop />
                            <Product />
                        </>
                    </Route>
                    <Route path="/pricing">
                        <>
                            <ScrollToTop />
                            <Pricing />
                        </>
                    </Route>
                    <Route path="/security">
                        <>
                            <ScrollToTop />
                            <Security />
                        </>
                    </Route>
                    <Route path="/feedback">
                        <>
                            <ScrollToTop />
                            <Feedback />
                        </>
                    </Route>
                    <Route path="/about">
                        <>
                            <ScrollToTop />
                            <About />
                        </>
                    </Route>
                    <Route path="/blog/:id">
                        <>
                            <ScrollToTop />
                            <BlogPost />
                        </>
                    </Route>
                    <Route path="/blog">
                        <>
                            <ScrollToTop />
                            <Blog />
                        </>
                    </Route>

                    {/* Fallback to Home */}
                    <Route>
                        <>
                            <ScrollToTop />
                            <Home />
                        </>
                    </Route>
                </Switch>
            </div>

            <Footer />
        </div>
    )
}

export default App
