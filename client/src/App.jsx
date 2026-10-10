import { useCallback, useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/products";
const ORDER_URL = "http://localhost:5000/api/orders";
const CART_KEY = "novamart-cart";
const FAVORITES_KEY = "novamart-favorites";

const money = (value) =>
  "₹" + Number(value || 0).toLocaleString("en-IN");

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getCart() {
  return readStorage(CART_KEY, []);
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("novamart-cart-updated"));
}

function cartCount(cart) {
  return cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

function ProductImage({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <div className={`product-no-image ${className}`}>n.</div>;
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt || "NovaMart product"}
      onError={() => setFailed(true)}
    />
  );
}

function Header({ count, goHome, goCart }) {
  function goSection(event, sectionId) {
    event.preventDefault();

    window.dispatchEvent(
      new CustomEvent("novamart-scroll-section", {
        detail: sectionId,
      })
    );
  }

  return (
    <header className="site-header">
      <a
        className="brand"
        href="/"
        onClick={(event) => {
          event.preventDefault();
          goHome();
        }}
      >
        nova<span>mart</span><i>.</i>
      </a>

      <nav className="main-nav">
        <a
          href="/#collection"
          onClick={(event) => goSection(event, "collection")}
        >
          Collection
        </a>
        <a
          href="/#philosophy"
          onClick={(event) => goSection(event, "philosophy")}
        >
          Our philosophy
        </a>
      </nav>

      <button className="cart-header-button" onClick={goCart}>
        <span className="cart-header-icon">↗</span>
        My cart
        <span className="cart-count">{count}</span>
      </button>
    </header>
  );
}

function ProductCard({ product, index, favorite, onFavorite, onOpen, onAdd }) {
  const stock = Number(product.stock || 0);

  return (
    <article className="product-card">
      <div className="product-image-wrap" onClick={() => onOpen(product._id)}>
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="product-image"
        />

        <span className="product-number">
          N° {String(index + 1).padStart(2, "0")}
        </span>

        <button
          className={`favorite-button ${favorite ? "is-favorite" : ""}`}
          aria-label={favorite ? "Remove favorite" : "Add favorite"}
          onClick={(event) => {
            event.stopPropagation();
            onFavorite(product._id);
          }}
        >
          {favorite ? "♥" : "♡"}
        </button>

        <span className={`stock-label ${stock < 1 ? "out-of-stock" : ""}`}>
          {stock > 0 ? "IN STOCK" : "SOLD OUT"}
        </span>
      </div>

      <div className="product-details">
        <div className="product-meta">
          <span>{product.category || "EVERYDAY"}</span>
          <span>{stock > 0 ? `${stock} LEFT` : "UNAVAILABLE"}</span>
        </div>

        <button
          className="product-name-button"
          onClick={() => onOpen(product._id)}
        >
          {product.name}
        </button>

        <p className="product-description">
          {product.description || "A thoughtfully selected everyday essential."}
        </p>

        <div className="product-bottom">
          <strong className="product-price">{money(product.price)}</strong>
          <button
            className="quick-add-button"
            disabled={stock < 1}
            onClick={() => onAdd(product)}
          >
            {stock > 0 ? "+ Add" : "Sold out"}
          </button>
        </div>
      </div>
    </article>
  );
}

function Storefront({ goHome, goCart, showToast, cart }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["Everything"]);
  const [category, setCategory] = useState("Everything");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [favorites, setFavorites] = useState(() =>
    readStorage(FAVORITES_KEY, [])
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Products could not be loaded.");
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : data.products;

      if (!Array.isArray(list)) {
        throw new Error("Unexpected product response.");
      }

      setProducts(list);
      setCategories([
        "Everything",
        ...new Set(list.map((product) => product.category).filter(Boolean)),
      ]);
    } catch {
      setError("Couldn't load the collection. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  function toggleFavorite(id) {
    setFavorites((current) => {
      const updated = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];

      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  function addToCart(product) {
    const stock = Number(product.stock || 0);
    const current = getCart();
    const existing = current.find((item) => item.productId === product._id);

    if (stock < 1) {
      showToast("This item is currently sold out.", "error");
      return;
    }

    if (existing && Number(existing.quantity || 0) >= stock) {
      showToast(`Only ${stock} available for ${product.name}.`, "error");
      return;
    }

    const updated = existing
      ? current.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: Number(item.quantity || 0) + 1 }
            : item
        )
      : [
          ...current,
          {
            productId: product._id,
            name: product.name,
            price: Number(product.price || 0),
            imageUrl: product.imageUrl || "",
            quantity: 1,
            stock,
          },
        ];

    saveCart(updated);
    showToast(`${product.name} added to your cart.`);
  }

  const visible = products
    .filter((product) => category === "Everything" || product.category === category)
    .filter(
      (product) =>
        !search.trim() ||
        [product.name, product.description, product.category].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(search.trim().toLowerCase())
        )
    )
    .sort((a, b) => {
      if (sort === "low") return Number(a.price) - Number(b.price);
      if (sort === "high") return Number(b.price) - Number(a.price);
      if (sort === "name") return String(a.name).localeCompare(String(b.name));
      return 0;
    });

  return (
    <div className="novamart">
      <Header count={cartCount(cart)} goHome={goHome} goCart={goCart} />

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="status-dot" /> THE EVERYDAY EDIT — 2026
            </p>

            <h1>
              Good things.
              <br />
              <span>Better living.</span>
            </h1>

            <p className="hero-description">
              Thoughtfully picked essentials for the way you live, work, and
              everything in between.
            </p>

            <a className="primary-button" href="#collection">
              Discover the collection <span>↘</span>
            </a>

            <div className="hero-note">
              <span>01 / CURATED FINDS</span>
              <span>Made for your everyday</span>
            </div>
          </div>

          <div className="hero-art">
            <div className="hero-placeholder">
              <div className="placeholder-orbit" />
              <div className="placeholder-orbit orbit-two" />
              <div className="placeholder-core">n.</div>
            </div>

            <div className="hero-sticker">
              <span>THE</span>
              <strong>GOOD</strong>
              <span>STUFF ✳</span>
            </div>

            <div className="hero-image-caption">
              <span>THE NOVAMART EDIT</span>
              <span>01 — 12</span>
            </div>
          </div>
        </section>

        <div className="ticker">
          <div className="ticker-track">
            {[0, 1].map((number) => (
              <div className="ticker-set" key={number}>
                LESS SCROLLING <b>✳</b> BETTER FINDS <b>✳</b>
                EVERYDAY ESSENTIALS <b>✳</b> A LITTLE MORE YOU <b>✳</b>
              </div>
            ))}
          </div>
        </div>

        <section className="collection-section" id="collection">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE NOVAMART EDIT</p>
              <h2>
                The collection<span>.</span>
              </h2>
            </div>
            <p className="section-description">
              Useful things. Lovely things.
              <br />
              Things you didn't know you needed.
            </p>
          </div>

          <div className="catalog-toolbar">
            <label className="search-box">
              <span>⌕</span>
              <input
                type="search"
                placeholder="Find your next favourite..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              {search && (
                <button
                  className="clear-search"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </label>

            <label className="sort-control">
              SORT BY
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="featured">Featured</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
                <option value="name">Name: A–Z</option>
              </select>
            </label>
          </div>

          <div className="category-row">
            {categories.map((item) => (
              <button
                key={item}
                className={`category-chip ${category === item ? "active" : ""}`}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="results-line">
            <span>
              {loading ? "LOADING COLLECTION..." : `${visible.length} ITEMS TO EXPLORE`}
            </span>
            <span>HANDPICKED FOR EVERYDAY LIFE</span>
          </div>

          {loading ? (
            <div className="catalog-message">
              <h3>Finding the good stuff...</h3>
            </div>
          ) : error ? (
            <div className="catalog-message">
              <h3>We couldn't load the collection.</h3>
              <p>{error}</p>
              <button className="primary-button" onClick={loadProducts}>
                Try again ↻
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="catalog-message">
              <h3>No finds this time.</h3>
              <p>Try another search or category.</p>
              <button
                className="primary-button"
                onClick={() => {
                  setSearch("");
                  setCategory("Everything");
                }}
              >
                Reset filters ↻
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {visible.map((product, index) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  index={index}
                  favorite={favorites.includes(product._id)}
                  onFavorite={toggleFavorite}
                  onOpen={(id) =>
                    window.dispatchEvent(
                      new CustomEvent("novamart-open-product", { detail: id })
                    )
                  }
                  onAdd={addToCart}
                />
              ))}
            </div>
          )}
        </section>

        <section className="manifesto" id="philosophy">
          <div className="manifesto-topline">
            <span>THE NOVAMART POINT OF VIEW</span>
            <span>EST. 2026</span>
          </div>

          <div className="manifesto-mark">n.</div>
          <p className="eyebrow">A LITTLE BIT OF EVERYTHING</p>
          <h2>
            Less, but <em>better.</em>
          </h2>

          <p className="manifesto-description">
            We believe everyday essentials should be useful, thoughtfully chosen,
            and a pleasure to live with. No endless scrolling. Just good things.
          </p>

          <a className="manifesto-link" href="#collection">
            Back to the collection <span>↗</span>
          </a>

          <div className="manifesto-bottomline">
            <span>THOUGHTFULLY SELECTED</span>
            <span>MADE FOR EVERYDAY LIFE</span>
          </div>
        </section>
      </main>

      <Footer goHome={goHome} />
    </div>
  );
}

function ProductDetails({ productId, goHome, goCart, cart, showToast }) {
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_URL}/${encodeURIComponent(productId)}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Product not found.");
        }

        if (active) setProduct(data.product || data);
      } catch (err) {
        if (active) setError(err.message || "Couldn't load this product.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [productId]);

  function addToCart() {
    if (!product) return;

    const stock = Number(product.stock || 0);
    const current = getCart();
    const existing = current.find((item) => item.productId === product._id);
    const existingQty = Number(existing?.quantity || 0);

    if (stock < 1) {
      showToast("This item is sold out.", "error");
      return;
    }

    if (existingQty + quantity > stock) {
      showToast(`Only ${stock} available.`, "error");
      return;
    }

    const updated = existing
      ? current.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: existingQty + quantity }
            : item
        )
      : [
          ...current,
          {
            productId: product._id,
            name: product.name,
            price: Number(product.price || 0),
            imageUrl: product.imageUrl || "",
            quantity,
            stock,
          },
        ];

    saveCart(updated);
    showToast(`${quantity} × ${product.name} added to your cart.`);
  }

  if (loading || error || !product) {
    return (
      <div className="novamart">
        <Header count={cartCount(cart)} goHome={goHome} goCart={goCart} />
        <div className="details-message">
          <p className="eyebrow">{loading ? "ONE MOMENT" : "PRODUCT DETAILS"}</p>
          <h2>{loading ? "Finding the good stuff..." : error || "Product not found."}</h2>
          <button className="primary-button" onClick={goHome}>
            Back to collection ↗
          </button>
        </div>
        <Footer goHome={goHome} />
      </div>
    );
  }

  const stock = Number(product.stock || 0);

  return (
    <div className="novamart">
      <Header count={cartCount(cart)} goHome={goHome} goCart={goCart} />

      <main className="details-page">
        <button className="details-back" onClick={goHome}>
          ← BACK TO COLLECTION
        </button>

        <div className="details-layout">
          <div className="details-image">
            <ProductImage src={product.imageUrl} alt={product.name} />
            <span className="details-image-tag">
              NOVAMART SELECT / {product.category || "EVERYDAY"}
            </span>
          </div>

          <div className="details-info">
            <p className="eyebrow">
              <span className="status-dot" /> PRODUCT / {product.category || "EVERYDAY"}
            </p>

            <h1>{product.name}</h1>
            <p className="details-price">{money(product.price)}</p>
            <div className="details-rule" />

            <p className="details-description">
              {product.description || "A thoughtfully selected everyday essential."}
            </p>

            <div className="details-stock">
              {stock > 0 ? `${stock} available` : "Currently out of stock"}
            </div>

            <div className="quantity-row">
              <span>QUANTITY</span>
              <div className="quantity-control">
                <button
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span>{quantity}</span>
                <button
                  disabled={quantity >= stock}
                  onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                >
                  +
                </button>
              </div>
            </div>

            <button
              className="details-add-button"
              disabled={stock < 1}
              onClick={addToCart}
            >
              {stock > 0 ? "ADD TO CART" : "OUT OF STOCK"} <span>↗</span>
            </button>

            <button className="details-cart-link" onClick={goCart}>
              View my cart ({cartCount(cart)}) →
            </button>
            <p className="details-note">Thoughtfully selected for everyday life.</p>
          </div>
        </div>
      </main>

      <Footer goHome={goHome} />
    </div>
  );
}

const emptyCustomer = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
};

function CheckoutForm({ cart, subtotal, onClose, onSuccess, showToast }) {
  const [customer, setCustomer] = useState(emptyCustomer);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setCustomer((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!cart.length) {
      setError("Your cart is empty.");
      return;
    }

    if (!/^[0-9]{10}$/.test(customer.phone.trim())) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    if (!/^[0-9]{5,10}$/.test(customer.postalCode.trim())) {
      setError("Enter a valid postal code.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(ORDER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          paymentMethod: "Cash on Delivery",
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: Number(item.quantity),
          })),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "We couldn't place your order.");
      }

      if (!data.order?._id) {
        throw new Error(
          "The server response did not include an order ID. Please check your orders before trying again."
        );
      }

      onSuccess(data.order);
    } catch (err) {
      setError(
        err.message ||
          "Could not connect to the order service. Check that the backend is running."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="checkout-overlay" role="presentation">
      <section
        className="checkout-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
      >
        <div className="checkout-panel-heading">
          <div>
            <p className="eyebrow">ONE LAST THING</p>
            <h2 id="checkout-title">Delivery details<span>.</span></h2>
            <p>Where should we send your good finds?</p>
          </div>

          <button
            type="button"
            className="checkout-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close checkout"
          >
            ×
          </button>
        </div>

        <div className="checkout-order-strip">
          <span>{cartCount(cart)} items</span>
          <strong>{money(subtotal)}</strong>
          <span>Cash on Delivery</span>
        </div>

        <form className="checkout-form" onSubmit={handleSubmit}>
          <label>
            Full name *
            <input
              name="name"
              autoComplete="name"
              value={customer.name}
              onChange={handleChange}
              maxLength={100}
              required
            />
          </label>

          <div className="checkout-two-columns">
            <label>
              Mobile number *
              <input
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={customer.phone}
                onChange={handleChange}
                pattern="[0-9]{10}"
                maxLength={10}
                placeholder="10-digit number"
                required
              />
            </label>

            <label>
              Email (optional)
              <input
                name="email"
                type="email"
                autoComplete="email"
                value={customer.email}
                onChange={handleChange}
                maxLength={150}
              />
            </label>
          </div>

          <label>
            Street address *
            <textarea
              name="address"
              autoComplete="street-address"
              value={customer.address}
              onChange={handleChange}
              maxLength={300}
              rows={3}
              required
            />
          </label>

          <div className="checkout-two-columns">
            <label>
              City *
              <input
                name="city"
                autoComplete="address-level2"
                value={customer.city}
                onChange={handleChange}
                maxLength={100}
                required
              />
            </label>

            <label>
              State *
              <input
                name="state"
                autoComplete="address-level1"
                value={customer.state}
                onChange={handleChange}
                maxLength={100}
                required
              />
            </label>
          </div>

          <label>
            Postal code *
            <input
              name="postalCode"
              inputMode="numeric"
              autoComplete="postal-code"
              value={customer.postalCode}
              onChange={handleChange}
              pattern="[0-9]{5,10}"
              maxLength={10}
              required
            />
          </label>

          <div className="checkout-payment-choice">
            <span className="checkout-payment-icon">₹</span>
            <span>
              <strong>Cash on Delivery</strong>
              <small>Pay when your order arrives.</small>
            </span>
            <span className="checkout-selected">✓</span>
          </div>

          {error && (
            <p className="checkout-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="checkout-place-order"
            type="submit"
            disabled={submitting || cart.length === 0}
          >
            {submitting ? "PLACING YOUR ORDER..." : `PLACE ORDER · ${money(subtotal)}`}
            {!submitting && <span>↗</span>}
          </button>

          <p className="checkout-form-note">
            Your order will be saved after the server confirms it. No online
            payment is collected.
          </p>
        </form>
      </section>
    </div>
  );
}

function OrderConfirmation({ order, goHome, goCart }) {
  return (
    <div className="novamart">
      <Header count={0} goHome={goHome} goCart={goCart} />

      <main className="order-confirmation">
        <div className="confirmation-mark">✓</div>
        <p className="eyebrow">THANK YOU FOR CHOOSING NOVAMART</p>
        <h1>
          It's a good <em>choice.</em>
        </h1>
        <p className="confirmation-description">
          Your order has been placed successfully. We've saved your order details.
        </p>

        <div className="confirmation-card">
          <div className="confirmation-row">
            <span>ORDER ID</span>
            <strong className="confirmation-order-id">{order._id}</strong>
          </div>
          <div className="confirmation-row">
            <span>ORDER STATUS</span>
            <strong>{order.orderStatus || "Placed"}</strong>
          </div>
          <div className="confirmation-row">
            <span>PAYMENT</span>
            <strong>Cash on Delivery</strong>
          </div>
          <div className="confirmation-row">
            <span>PAYMENT STATUS</span>
            <strong>{order.paymentStatus || "Pending"}</strong>
          </div>
          <div className="confirmation-row confirmation-total">
            <span>ORDER TOTAL</span>
            <strong>{money(order.totalAmount)}</strong>
          </div>
        </div>

        <p className="confirmation-note">
          Keep your order ID for reference. Payment is due when the order arrives.
        </p>

        <button className="primary-button" onClick={goHome}>
          Continue exploring ↗
        </button>
      </main>

      <Footer goHome={goHome} />
    </div>
  );
}

function CartPage({ cart, goHome, goCart, showToast }) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  function updateQuantity(productId, change) {
    const item = cart.find((entry) => entry.productId === productId);
    if (!item) return;

    const next = Number(item.quantity || 1) + change;
    const stock = Number(item.stock || 999);

    if (next > stock) {
      showToast(`Only ${stock} available.`, "error");
      return;
    }

    const updated =
      next <= 0
        ? cart.filter((entry) => entry.productId !== productId)
        : cart.map((entry) =>
            entry.productId === productId
              ? { ...entry, quantity: next }
              : entry
          );

    saveCart(updated);
  }

  function removeItem(productId) {
    saveCart(cart.filter((item) => item.productId !== productId));
    showToast("Item removed from your cart.");
  }

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  function handleOrderSuccess(order) {
    saveCart([]);
    setCheckoutOpen(false);
    setCompletedOrder(order);
  }

  if (completedOrder) {
    return (
      <OrderConfirmation
        order={completedOrder}
        goHome={goHome}
        goCart={goCart}
      />
    );
  }

  return (
    <div className="novamart">
      <Header count={cartCount(cart)} goHome={goHome} goCart={goCart} />

      <main className="cart-page">
        <div className="cart-intro">
          <p className="eyebrow">YOUR GOOD FINDS, ALL IN ONE PLACE</p>
          <h1>
            My cart<span>.</span>
          </h1>
          <p>Good choices. Nearly yours.</p>
        </div>

        {cart.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-symbol">n.</div>
            <p className="eyebrow">NOTHING HERE — YET</p>
            <h2>Your next favourite is waiting.</h2>
            <p>
              Explore the collection and find something that makes everyday better.
            </p>
            <button className="primary-button" onClick={goHome}>
              Explore the collection ↗
            </button>
          </div>
        ) : (
          <div className="cart-layout">
            <section className="cart-items">
              <div className="cart-list-heading">
                <span>YOUR SELECTION</span>
                <span>{cartCount(cart)} ITEMS</span>
              </div>

              {cart.map((item) => (
                <article className="cart-item" key={item.productId}>
                  <div className="cart-item-image">
                    <ProductImage src={item.imageUrl} alt={item.name} />
                  </div>

                  <div className="cart-item-info">
                    <p className="eyebrow">NOVAMART SELECT</p>
                    <h3>{item.name}</h3>
                    <p className="cart-item-price">{money(item.price)}</p>

                    <div className="cart-item-actions">
                      <div className="quantity-control">
                        <button
                          onClick={() => updateQuantity(item.productId, -1)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <button
                        className="remove-item"
                        onClick={() => removeItem(item.productId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <strong className="cart-line-total">
                    {money(Number(item.price || 0) * Number(item.quantity || 0))}
                  </strong>
                </article>
              ))}

              <button className="continue-shopping" onClick={goHome}>
                ← Continue shopping
              </button>
            </section>

            <aside className="order-summary">
              <p className="eyebrow">THE BREAKDOWN</p>
              <h2>Order summary</h2>

              <div className="summary-line">
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>

              <div className="summary-line">
                <span>Delivery</span>
                <span>Free</span>
              </div>

              <div className="summary-total">
                <span>Order total</span>
                <strong>{money(subtotal)}</strong>
              </div>

              <p className="summary-note">
                A collection of good things, thoughtfully chosen.
              </p>

              <button
                className="checkout-button"
                onClick={() => setCheckoutOpen(true)}
              >
                CHECKOUT <span>↗</span>
              </button>

              <p className="checkout-disclaimer">
                Cash on Delivery · Pay when your order arrives.
              </p>
            </aside>
          </div>
        )}
      </main>

      <Footer goHome={goHome} />

      {checkoutOpen && (
        <CheckoutForm
          cart={cart}
          subtotal={subtotal}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={handleOrderSuccess}
          showToast={showToast}
        />
      )}
    </div>
  );
}

function Footer({ goHome }) {
  return (
    <footer className="site-footer">
      <a
        className="footer-brand"
        href="/"
        onClick={(event) => {
          event.preventDefault();
          goHome();
        }}
      >
        nova<span>mart</span><i>.</i>
      </a>

      <span>THE EVERYDAY EDIT</span>

      <button
        className="back-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        BACK TO TOP ↑
      </button>

      <p>© 2026 NOVAMART. THOUGHTFULLY SELECTED.</p>
    </footer>
  );
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [cart, setCart] = useState(getCart);
  const [toast, setToast] = useState(null);
  const [toastVersion, setToastVersion] = useState(0);

  const go = useCallback((nextPath) => {
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }

    setPath(nextPath);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goHome = useCallback(() => go("/"), [go]);
  const goCart = useCallback(() => go("/cart"), [go]);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setToastVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    const syncCart = () => setCart(getCart());

    const onPop = () => {
      setPath(window.location.pathname);

      if (window.location.hash) {
        const sectionId = window.location.hash.slice(1);
        window.setTimeout(() => {
          document.getElementById(sectionId)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 150);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    const onOpenProduct = (event) =>
      go(`/product/${encodeURIComponent(event.detail)}`);

    const onScrollSection = (event) => {
      const sectionId = event.detail;
      if (!["collection", "philosophy"].includes(sectionId)) return;

      const targetUrl = `/#${sectionId}`;

      if (
        window.location.pathname !== "/" ||
        window.location.hash !== `#${sectionId}`
      ) {
        window.history.pushState({}, "", targetUrl);
      }

      if (window.location.pathname !== "/") {
        setPath("/");
      }

      window.setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 180);
    };

    window.addEventListener("novamart-cart-updated", syncCart);
    window.addEventListener("storage", syncCart);
    window.addEventListener("popstate", onPop);
    window.addEventListener("novamart-open-product", onOpenProduct);
    window.addEventListener("novamart-scroll-section", onScrollSection);

    return () => {
      window.removeEventListener("novamart-cart-updated", syncCart);
      window.removeEventListener("storage", syncCart);
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("novamart-open-product", onOpenProduct);
      window.removeEventListener("novamart-scroll-section", onScrollSection);
    };
  }, [go]);

  useEffect(() => {
    if (!toast) return undefined;

    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast, toastVersion]);

  const productMatch = path.match(/^\/product\/([^/]+)\/?$/);

  return (
    <>
      {productMatch ? (
        <ProductDetails
          key={productMatch[1]}
          productId={decodeURIComponent(productMatch[1])}
          goHome={goHome}
          goCart={goCart}
          cart={cart}
          showToast={showToast}
        />
      ) : path === "/cart" ? (
        <CartPage
          cart={cart}
          goHome={goHome}
          goCart={goCart}
          showToast={showToast}
        />
      ) : (
        <Storefront
          goHome={goHome}
          goCart={goCart}
          showToast={showToast}
          cart={cart}
        />
      )}

      {toast && (
        <div
          className={`toast toast-${toast.type}`}
          role="status"
          aria-live="polite"
        >
          <span className="toast-check">
            {toast.type === "success" ? "✓" : "!"}
          </span>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-cart-link" onClick={goCart}>
            VIEW CART ↗
          </button>
          <button
            className="toast-close"
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}