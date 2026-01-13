import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="font-display text-2xl font-semibold tracking-tight">
              ÉLÉGANCE
            </Link>
            <p className="mt-4 text-sm text-primary-foreground/70 leading-relaxed">
              Luxury fashion rental for the modern woman. Access designer pieces 
              without the commitment.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-display text-lg font-medium mb-4">Shop</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/products" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  All Collection
                </Link>
              </li>
              <li>
                <Link to="/products?category=dresses" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  Dresses
                </Link>
              </li>
              <li>
                <Link to="/products?category=outerwear" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  Outerwear
                </Link>
              </li>
              <li>
                <Link to="/products?category=tops" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  Tops
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-display text-lg font-medium mb-4">Help</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  Sizing Guide
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  Shipping & Returns
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display text-lg font-medium mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  Sustainability
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-primary-foreground/50">
              © {new Date().getFullYear()} Élégance. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-xs text-primary-foreground/50 hover:text-primary-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-xs text-primary-foreground/50 hover:text-primary-foreground transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
