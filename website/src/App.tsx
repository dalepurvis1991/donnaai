import { Router, Route, Switch } from 'wouter'
import Home from './pages/Home'
import Odoo from './pages/Odoo'
import Pricing from './pages/Pricing'
import Integrations from './pages/Integrations'
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

            <div className="flex-grow">
                <Switch>
                    <Route path="/">
                        <>
                            <ScrollToTop />
                            <Home />
                        </>
                    </Route>
                    <Route path="/odoo">
                        <>
                            <ScrollToTop />
                            <Odoo />
                        </>
                    </Route>
                    <Route path="/pricing">
                        <>
                            <ScrollToTop />
                            <Pricing />
                        </>
                    </Route>
                    <Route path="/integrations">
                        <>
                            <ScrollToTop />
                            <Integrations />
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
