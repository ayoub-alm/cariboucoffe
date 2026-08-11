import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  emoji: string;
}

interface CartItem extends Product {
  quantity: number;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="landing-page" [class.cart-open]="isCartOpen()">
      
      <!-- Background floating beans (kept for Caribou vibe) -->
      <div class="bg-beans">
        <div class="bean bean-1">☕</div>
        <div class="bean bean-2">☕</div>
        <div class="bean bean-3">☕</div>
        <div class="bean bean-4">☕</div>
        <div class="bean bean-5">☕</div>
        <div class="bean bean-6">☕</div>
      </div>

      <!-- Navigation -->
      <nav class="navbar">
        <div class="nav-content">
          <div class="logo-area">
            <img src="/logo.png" alt="Caribou Coffee" class="logo-img" />
          </div>
          
          <div class="nav-actions">
            <!-- Cart Button -->
            <button class="btn-cart" (click)="toggleCart()">
              <span class="cart-icon">🛒</span>
              <span class="cart-badge" *ngIf="cartItemCount() > 0">{{ cartItemCount() }}</span>
            </button>
            <!-- Login Button -->
            <a routerLink="/login" class="btn-login">
              Connexion <span class="arrow">→</span>
            </a>
          </div>
        </div>
      </nav>

      <!-- Main Content Area -->
      <div class="main-container">
        
        <!-- Hero Section -->
        <header class="hero">
          <div class="hero-content">
            <h1 class="tagline">Life is short.<br><span class="highlight">Stay awake for it.</span></h1>
            <p class="purpose">Enjoy our expertly crafted beverages and treats. Order now for a day-making experience.</p>
          </div>
          <div class="hero-graphic">
            <div class="glow"></div>
            <div class="floating-cup">
              <div class="steam s1"></div>
              <div class="steam s2"></div>
              <div class="steam s3"></div>
              <div class="cup">
                <div class="cup-body">
                  <div class="cup-inner"><span class="cup-emoji">🦌</span></div>
                  <div class="cup-handle"></div>
                </div>
                <div class="saucer"></div>
              </div>
            </div>
          </div>
        </header>

        <!-- Storefront Menu Section -->
        <section class="menu-section">
          
          <!-- Category Filters -->
          <div class="category-filters">
            <button 
              *ngFor="let cat of categories" 
              class="cat-pill" 
              [class.active]="activeCategory() === cat.id"
              (click)="setCategory(cat.id)">
              <span class="cat-icon">{{ cat.icon }}</span>
              {{ cat.name }}
            </button>
          </div>

          <!-- Product Grid -->
          <div class="products-grid">
            <div class="product-card" *ngFor="let product of filteredProducts()">
              <div class="product-image">
                <span class="product-emoji">{{ product.emoji }}</span>
              </div>
              <div class="product-info">
                <h3 class="product-name">{{ product.name }}</h3>
                <p class="product-desc">{{ product.description }}</p>
                <div class="product-footer">
                  <span class="product-price">{{ product.price | currency:'USD' }}</span>
                  <button class="btn-add" (click)="addToCart(product)">
                    <span class="add-icon">+</span> Ajouter
                  </button>
                </div>
              </div>
            </div>
          </div>

        </section>

        <!-- Footer -->
        <footer class="footer">
          <p class="copyright">&copy; {{ currentYear }} Caribou Coffee. Tous droits réservés.</p>
        </footer>
        
      </div> <!-- End main-container -->

      <!-- Slide-out Cart Drawer -->
      <div class="cart-overlay" (click)="closeCart()"></div>
      <aside class="cart-drawer">
        <div class="cart-header">
          <h2>Votre Panier</h2>
          <button class="btn-close" (click)="closeCart()">✕</button>
        </div>

        <div class="cart-body">
          <div class="empty-cart" *ngIf="cart().length === 0">
            <span class="empty-icon">🛒</span>
            <p>Votre panier est vide</p>
            <button class="btn-primary small" (click)="closeCart()">Découvrir le menu</button>
          </div>

          <div class="cart-items" *ngIf="cart().length > 0">
            <div class="cart-item" *ngFor="let item of cart()">
              <div class="item-emoji">{{ item.emoji }}</div>
              <div class="item-details">
                <h4>{{ item.name }}</h4>
                <div class="item-controls">
                  <div class="qty-control">
                    <button (click)="updateQuantity(item.id, -1)">-</button>
                    <span>{{ item.quantity }}</span>
                    <button (click)="updateQuantity(item.id, 1)">+</button>
                  </div>
                  <span class="item-price">{{ (item.price * item.quantity) | currency:'USD' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="cart-footer" *ngIf="cart().length > 0">
          <div class="summary-line">
            <span>Sous-total</span>
            <span>{{ subtotal() | currency:'USD' }}</span>
          </div>
          <div class="summary-line">
            <span>Taxes (10%)</span>
            <span>{{ taxes() | currency:'USD' }}</span>
          </div>
          <div class="summary-line total">
            <span>Total</span>
            <span>{{ total() | currency:'USD' }}</span>
          </div>

          <!-- Fake Checkout Success Message -->
          <div class="success-message" *ngIf="showSuccess()">
            ✅ Commande validée avec succès!
          </div>

          <button class="btn-checkout" [disabled]="showSuccess()" (click)="checkout()">
            <span *ngIf="!showSuccess()">Commander - {{ total() | currency:'USD' }}</span>
            <span *ngIf="showSuccess()">Préparation en cours...</span>
          </button>
        </div>
      </aside>

    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

    .landing-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #1b130e 0%, #3e2b21 40%, #291c15 70%, #150f0b 100%);
      font-family: 'Outfit', 'Google Sans', sans-serif;
      color: #ffffff;
      overflow-x: hidden;
      position: relative;
    }

    /* Prevent scrolling on body when cart is open (simulated by class on wrapper) */
    .landing-page.cart-open .main-container {
      filter: blur(4px);
      pointer-events: none;
      transition: filter 0.3s ease;
    }

    .main-container {
      transition: filter 0.3s ease;
      padding-top: 80px; /* offset for fixed navbar */
    }

    /* ── Background floating beans ── */
    .bg-beans { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
    .bean { position: absolute; opacity: 0.05; animation: floatBean 12s ease-in-out infinite; filter: grayscale(100%); }
    .bean-1 { top: 15%; left: 10%; animation-delay: 0s; font-size: 3rem; }
    .bean-2 { top: 65%; left: 5%; animation-delay: 2s; font-size: 2rem; }
    .bean-3 { top: 25%; right: 10%; animation-delay: 4s; font-size: 4rem; }
    .bean-4 { bottom: 20%; right: 15%; animation-delay: 1s; font-size: 2.5rem; }
    .bean-5 { top: 50%; left: 50%; animation-delay: 5s; font-size: 1.5rem; opacity: 0.03; }
    .bean-6 { top: 80%; right: 40%; animation-delay: 3s; font-size: 3.5rem; }

    @keyframes floatBean {
      0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.05; }
      50% { transform: translateY(-30px) rotate(20deg); opacity: 0.1; }
    }

    /* ── Navbar ── */
    .navbar {
      position: fixed; top: 0; left: 0; right: 0; height: 80px; z-index: 100;
      background: rgba(27, 19, 14, 0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .nav-content {
      max-width: 1200px; margin: 0 auto; height: 100%; padding: 0 24px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .logo-img { height: 48px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); }
    .nav-actions { display: flex; align-items: center; gap: 16px; }

    .btn-cart {
      background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
      cursor: pointer; position: relative; color: white; transition: all 0.2s ease;
    }
    .btn-cart:hover { background: rgba(255, 255, 255, 0.15); transform: scale(1.05); }
    .cart-icon { font-size: 20px; }
    .cart-badge {
      position: absolute; top: -4px; right: -4px; background: #e74c3c; color: white;
      font-size: 11px; font-weight: 700; width: 18px; height: 18px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.4);
    }

    .btn-login {
      display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px; border-radius: 50px;
      background: rgba(255, 255, 255, 0.1); color: #ffffff; text-decoration: none;
      font-weight: 600; font-size: 14px; border: 1px solid rgba(255, 255, 255, 0.2); transition: all 0.3s ease;
    }
    .btn-login:hover { background: rgba(255, 255, 255, 0.2); transform: translateY(-2px); }
    .btn-login .arrow { transition: transform 0.3s ease; }
    .btn-login:hover .arrow { transform: translateX(4px); }

    /* ── Hero Section ── */
    .hero {
      position: relative; z-index: 10; max-width: 1200px; margin: 0 auto;
      padding: 60px 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center;
    }
    .hero-content { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
    .tagline { font-size: clamp(40px, 5vw, 64px); font-weight: 800; line-height: 1.1; margin: 0 0 16px; letter-spacing: -1px; }
    .tagline .highlight { background: linear-gradient(135deg, #78c2d4, #6db1c2, #4893a7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .purpose { font-size: 18px; line-height: 1.6; color: rgba(255, 255, 255, 0.75); margin: 0; max-width: 480px; }
    
    .hero-graphic { position: relative; display: flex; justify-content: center; align-items: center; animation: fadeIn 1s 0.3s both; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .glow { position: absolute; width: 250px; height: 250px; background: radial-gradient(circle, rgba(109, 177, 194, 0.2) 0%, transparent 70%); border-radius: 50%; z-index: 1; }
    .floating-cup { position: relative; z-index: 2; animation: gentleWobble 6s ease-in-out infinite; transform-origin: bottom center; transform: scale(1.3); }
    @keyframes gentleWobble { 0%, 100% { transform: scale(1.3) translateY(0); } 50% { transform: scale(1.3) translateY(-15px); } }

    /* Cup styles (same as before) */
    .cup-body { position: relative; width: 80px; height: 72px; background: linear-gradient(160deg, #6db1c2, #418596); border-radius: 6px 6px 20px 20px; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 -4px 8px rgba(0,0,0,0.3), 0 12px 24px rgba(0,0,0,0.5); }
    .cup-inner { width: 64px; height: 56px; background: linear-gradient(160deg, #78c2d4, #4893a7); border-radius: 4px 4px 16px 16px; display: flex; align-items: center; justify-content: center; }
    .cup-emoji { font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); }
    .cup-handle { position: absolute; right: -14px; top: 16px; width: 16px; height: 28px; border: 4px solid #6db1c2; border-left: none; border-radius: 0 12px 12px 0; }
    .saucer { width: 96px; height: 12px; background: linear-gradient(160deg, #5ba4b7, #377686); border-radius: 50%; margin-top: -2px; box-shadow: 0 8px 16px rgba(0,0,0,0.5); }
    .steam { position: absolute; width: 6px; border-radius: 50px; background: rgba(255, 255, 255, 0.2); animation: steamRise 3s ease-in-out infinite; }
    .s1 { height: 40px; left: 20px; top: -50px; animation-delay: 0s; }
    .s2 { height: 60px; left: 40px; top: -60px; animation-delay: 0.8s; }
    .s3 { height: 45px; left: 60px; top: -40px; animation-delay: 1.6s; }
    @keyframes steamRise { 0% { transform: translateY(0) scaleX(1); opacity: 0; } 20% { opacity: 0.6; } 80% { opacity: 0.2; } 100% { transform: translateY(-80px) scaleX(2.5); opacity: 0; } }

    /* ── Menu Section ── */
    .menu-section { position: relative; z-index: 10; max-width: 1200px; margin: 40px auto; padding: 0 24px; }
    
    .category-filters {
      display: flex; gap: 12px; overflow-x: auto; padding-bottom: 16px; margin-bottom: 32px;
      scrollbar-width: none; /* Firefox */
    }
    .category-filters::-webkit-scrollbar { display: none; }
    
    .cat-pill {
      background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 10px 20px; border-radius: 50px; color: rgba(255,255,255,0.8);
      font-family: inherit; font-size: 15px; font-weight: 500; cursor: pointer;
      display: flex; align-items: center; gap: 8px; white-space: nowrap; transition: all 0.2s ease;
    }
    .cat-pill:hover { background: rgba(255, 255, 255, 0.1); }
    .cat-pill.active {
      background: linear-gradient(135deg, #78c2d4, #4893a7); color: #1a0a00; font-weight: 700; border-color: transparent;
      box-shadow: 0 4px 12px rgba(109, 177, 194, 0.3);
    }

    .products-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px;
    }
    .product-card {
      background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; overflow: hidden;
      display: flex; flex-direction: column; transition: all 0.3s ease;
    }
    .product-card:hover {
      transform: translateY(-4px); background: rgba(255, 255, 255, 0.06);
      border-color: rgba(109, 177, 194, 0.3); box-shadow: 0 12px 24px rgba(0,0,0,0.4);
    }
    .product-image {
      height: 140px; background: rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;
    }
    .product-emoji { font-size: 64px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4)); transition: transform 0.3s ease; }
    .product-card:hover .product-emoji { transform: scale(1.1) rotate(5deg); }
    
    .product-info { padding: 20px; flex: 1; display: flex; flex-direction: column; }
    .product-name { font-size: 18px; font-weight: 700; margin: 0 0 8px; color: #ffffff; }
    .product-desc { font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.4; margin: 0 0 16px; flex: 1; }
    
    .product-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
    .product-price { font-size: 18px; font-weight: 800; color: #d4a647; }
    .btn-add {
      background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 50px;
      padding: 6px 16px; color: white; font-family: inherit; font-size: 13px; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s ease;
    }
    .btn-add:hover { background: #6db1c2; color: #1a0a00; border-color: transparent; }
    .btn-add:active { transform: scale(0.95); }

    /* ── Slide-out Cart Drawer ── */
    .cart-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
      z-index: 1000; opacity: 0; visibility: hidden; transition: all 0.3s ease;
    }
    .landing-page.cart-open .cart-overlay { opacity: 1; visibility: visible; }
    
    .cart-drawer {
      position: fixed; top: 0; right: -400px; bottom: 0; width: 400px; max-width: 100%;
      background: #231913; border-left: 1px solid rgba(255,255,255,0.1); box-shadow: -10px 0 30px rgba(0,0,0,0.5);
      z-index: 1001; transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex; flex-direction: column;
    }
    .landing-page.cart-open .cart-drawer { right: 0; }

    .cart-header {
      padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.05);
      display: flex; justify-content: space-between; align-items: center;
    }
    .cart-header h2 { margin: 0; font-size: 20px; font-weight: 700; }
    .btn-close { background: none; border: none; color: white; font-size: 20px; cursor: pointer; opacity: 0.6; }
    .btn-close:hover { opacity: 1; }

    .cart-body { flex: 1; overflow-y: auto; padding: 24px; }
    .empty-cart { text-align: center; color: rgba(255,255,255,0.5); margin-top: 40px; }
    .empty-icon { font-size: 48px; display: block; margin-bottom: 16px; opacity: 0.5; }
    .empty-cart p { margin-bottom: 24px; }
    .btn-primary.small { padding: 10px 20px; font-size: 14px; background: linear-gradient(135deg, #78c2d4, #4893a7); border: none; border-radius: 50px; color: #1a0a00; font-weight: 600; cursor: pointer; }

    .cart-item {
      display: flex; gap: 16px; padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .item-emoji {
      width: 60px; height: 60px; background: rgba(0,0,0,0.2); border-radius: 12px;
      display: flex; align-items: center; justify-content: center; font-size: 32px;
    }
    .item-details { flex: 1; }
    .item-details h4 { margin: 0 0 8px; font-size: 15px; font-weight: 600; }
    .item-controls { display: flex; justify-content: space-between; align-items: center; }
    .qty-control {
      display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.05);
      border-radius: 50px; padding: 4px 8px; border: 1px solid rgba(255,255,255,0.1);
    }
    .qty-control button { background: none; border: none; color: white; font-size: 16px; cursor: pointer; padding: 0 4px; }
    .qty-control button:hover { color: #6db1c2; }
    .item-price { font-weight: 700; color: #d4a647; }

    .cart-footer { padding: 24px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.05); }
    .summary-line { display: flex; justify-content: space-between; margin-bottom: 12px; color: rgba(255,255,255,0.7); font-size: 14px; }
    .summary-line.total { color: white; font-size: 18px; font-weight: 800; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); }
    
    .btn-checkout {
      width: 100%; padding: 16px; margin-top: 24px; border-radius: 12px; border: none;
      background: linear-gradient(135deg, #d4a647, #b8860b); color: #1a0a00; font-family: inherit;
      font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s ease;
    }
    .btn-checkout:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(212, 166, 71, 0.3); }
    .btn-checkout:disabled { background: #4a3728; color: rgba(255,255,255,0.5); cursor: not-allowed; }

    .success-message {
      background: rgba(46, 204, 113, 0.2); color: #2ecc71; padding: 12px; border-radius: 8px;
      text-align: center; margin-top: 16px; font-weight: 600; font-size: 14px; border: 1px solid rgba(46, 204, 113, 0.3);
      animation: fadeIn 0.3s ease;
    }

    /* ── Footer ── */
    .footer { position: relative; z-index: 10; text-align: center; padding: 40px 24px; border-top: 1px solid rgba(255, 255, 255, 0.05); margin-top: 80px; }
    .copyright { font-size: 13px; color: rgba(255, 255, 255, 0.4); margin: 0; }

    /* ── Responsive ── */
    @media (max-width: 900px) {
      .hero { grid-template-columns: 1fr; text-align: center; gap: 0; padding-top: 40px; }
      .purpose { margin: 0 auto 32px; }
      .hero-graphic { margin-top: 32px; display: none; } /* Hide cup on small screens to save space for menu */
    }
  `]
})
export class LandingComponent {
  currentYear = new Date().getFullYear();

  // State Signals
  isCartOpen = signal(false);
  activeCategory = signal('all');
  cart = signal<CartItem[]>([]);
  showSuccess = signal(false);

  // Fake Database
  categories = [
    { id: 'all', name: 'All Menu', icon: '📋' },
    { id: 'hot', name: 'Hot Coffees', icon: '☕' },
    { id: 'iced', name: 'Iced Coffees', icon: '🧊' },
    { id: 'food', name: 'Food & Bakery', icon: '🥐' }
  ];

  products: Product[] = [
    { id: '1', name: 'Campfire Mocha', description: 'Real chocolate melted into steamed milk, espresso, and toasted marshmallow flavor.', price: 5.95, category: 'hot', emoji: '🔥' },
    { id: '2', name: 'Caramel High Rise', description: 'Espresso and steamed milk combined with real caramel; topped with whipped cream.', price: 5.45, category: 'hot', emoji: '☕' },
    { id: '3', name: 'Northern Lite Latte', description: 'A guilt-free classic with fewer calories, featuring our signature espresso.', price: 4.85, category: 'hot', emoji: '🤍' },
    { id: '4', name: 'Iced Crafted Press', description: 'Cold brewed coffee with a splash of milk and real sugar, served over ice.', price: 4.25, category: 'iced', emoji: '🧊' },
    { id: '5', name: 'Cold Brew', description: 'Steeped for 12 hours for a smooth, bold flavor without the bitterness.', price: 4.50, category: 'iced', emoji: '🧊' },
    { id: '6', name: 'Bacon & Gouda Soufflé', description: 'Savory soufflé baked to perfection with bacon, gouda cheese, and eggs.', price: 4.95, category: 'food', emoji: '🥓' },
    { id: '7', name: 'Lemon Loaf', description: 'Moist and sweet lemon cake with a tangy icing drizzle.', price: 3.25, category: 'food', emoji: '🍋' },
    { id: '8', name: 'Maple Waffle Sandwich', description: 'Chicken sausage and cheese hugged by two sweet maple waffles.', price: 5.25, category: 'food', emoji: '🧇' }
  ];

  // Computed Values
  filteredProducts = computed(() => {
    const cat = this.activeCategory();
    if (cat === 'all') return this.products;
    return this.products.filter(p => p.category === cat);
  });

  cartItemCount = computed(() => {
    return this.cart().reduce((total, item) => total + item.quantity, 0);
  });

  subtotal = computed(() => {
    return this.cart().reduce((total, item) => total + (item.price * item.quantity), 0);
  });

  taxes = computed(() => {
    return this.subtotal() * 0.10; // 10% fake tax
  });

  total = computed(() => {
    return this.subtotal() + this.taxes();
  });

  // Actions
  setCategory(categoryId: string) {
    this.activeCategory.set(categoryId);
  }

  toggleCart() {
    this.isCartOpen.update(v => !v);
  }

  closeCart() {
    this.isCartOpen.set(false);
    this.showSuccess.set(false);
  }

  addToCart(product: Product) {
    const currentCart = this.cart();
    const existingItem = currentCart.find(item => item.id === product.id);

    if (existingItem) {
      this.cart.set(currentCart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      this.cart.set([...currentCart, { ...product, quantity: 1 }]);
    }
  }

  updateQuantity(productId: string, change: number) {
    const currentCart = this.cart();
    this.cart.set(currentCart.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => {
      // Remove item if quantity becomes 0 (handled by allowing decrement to 0, but let's actually remove it)
      if (item.id === productId && item.quantity + change <= 0) {
          return false;
      }
      return true;
    }));
  }

  checkout() {
    if (this.cart().length === 0) return;
    
    // Simulate processing
    this.showSuccess.set(true);
    
    setTimeout(() => {
      this.cart.set([]); // Clear cart
      setTimeout(() => {
        this.closeCart();
      }, 2000);
    }, 1500);
  }
}
