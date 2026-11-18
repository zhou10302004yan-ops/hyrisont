
"use client";

import { useEffect, useMemo, useState } from "react";

type Role = "renter" | "owner" | "admin";
type Status =
  | "Pending"
  | "Accepted"
  | "Awaiting payment"
  | "Paid"
  | "Active"
  | "Completed"
  | "Declined"
  | "Cancelled";

type Delivery = "Pickup" | "Hyrisont Delivery";

type Listing = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  owner: string;
  image: string;
};

type Booking = {
  id: string;
  listingId: string;
  listingName: string;
  renter: string;
  owner: string;
  start: string;
  end: string;
  days: number;
  itemPrice: number;
  delivery: Delivery;
  deliveryFee: number;
  total: number;
  status: Status;
  deliveryStatus: string;
};

type AppData = {
  listings: Listing[];
  bookings: Booking[];
};

const STORAGE_KEY = "hyrisont-app-v3";

const initialListings: Listing[] = [
  {
    id: "1",
    name: "Mountain Bike",
    category: "Sports",
    description: "A comfortable mountain bike for exploring Gotland.",
    price: 90,
    owner: "Alex Owner",
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=900",
  },
  {
    id: "2",
    name: "Camping Tent",
    category: "Outdoor",
    description: "Two-person tent suitable for weekend camping.",
    price: 70,
    owner: "Emma Rental",
    image: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=900",
  },
  {
    id: "3",
    name: "Electric Drill",
    category: "Tools",
    description: "Electric drill for small home improvement projects.",
    price: 55,
    owner: "Alex Owner",
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=900",
  },
  {
    id: "4",
    name: "Bluetooth Speaker",
    category: "Electronics",
    description: "Portable speaker for outdoor activities.",
    price: 45,
    owner: "Emma Rental",
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=900",
  },
  {
    id: "5",
    name: "Digital Camera",
    category: "Electronics",
    description: "Compact camera for travel and everyday photography.",
    price: 120,
    owner: "Nordic Share",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=900",
  },
  {
    id: "6",
    name: "Camping Chair",
    category: "Outdoor",
    description: "Lightweight folding chair.",
    price: 25,
    owner: "Alex Owner",
    image: "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=900",
  },
];

const initialData: AppData = {
  listings: initialListings,
  bookings: [],
};

const money = (value: number) =>
  new Intl.NumberFormat("en-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(value);

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function calculateDays(start: string, end: string) {
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(`${end}T12:00:00`);
  const difference = Math.ceil(
    (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(1, difference + 1);
}

export default function Home() {
  const [role, setRole] = useState<Role>("renter");
  const [tab, setTab] = useState("home");
  const [data, setData] = useState<AppData>(initialData);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<Listing | null>(null);
  const [message, setMessage] = useState("");
  const [bookingListing, setBookingListing] = useState<Listing | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [delivery, setDelivery] = useState<Delivery>("Pickup");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Outdoor");
  const [newDescription, setNewDescription] = useState("");
  const [newPrice, setNewPrice] = useState("50");

  const [paymentBooking, setPaymentBooking] = useState<string | null>(null);

  const currentUser =
    role === "renter"
      ? "Demo Renter"
      : role === "owner"
        ? "Alex Owner"
        : "Platform Admin";

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AppData;
        if (
          Array.isArray(parsed.listings) &&
          Array.isArray(parsed.bookings)
        ) {
          setData(parsed);
        }
      }
    } catch (error) {
      console.error("Could not load Hyrisont data:", error);
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Could not save Hyrisont data:", error);
    }
  }, [data, ready]);

  const visibleListings = useMemo(() => {
    return data.listings.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || item.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [data.listings, search, category]);

  const myBookings = data.bookings.filter((booking) => {
    if (role === "renter") return booking.renter === currentUser;
    if (role === "owner") return booking.owner === currentUser;
    return true;
  });

  function switchRole(nextRole: Role) {
    if (nextRole === role) return;

    setSelected(null);
    setBookingListing(null);
    setPaymentBooking(null);
    setMessage("");
    setSearch("");
    setCategory("All");
    setTab("home");
    setRole(nextRole);
  }

  function createBooking(listing: Listing) {
    if (!startDate || !endDate) {
      setMessage("Please select your rental dates.");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setMessage("The end date must be after the start date.");
      return;
    }

    const days = calculateDays(startDate, endDate);
    const itemPrice = listing.price * days;
    const deliveryFee = delivery === "Hyrisont Delivery" ? 50 : 0;

    const booking: Booking = {
      id: makeId(),
      listingId: listing.id,
      listingName: listing.name,
      renter: "Demo Renter",
      owner: listing.owner,
      start: startDate,
      end: endDate,
      days,
      itemPrice,
      delivery,
      deliveryFee,
      total: itemPrice + deliveryFee,
      status: "Pending",
      deliveryStatus:
        delivery === "Hyrisont Delivery"
          ? "Delivery requested"
          : "Pickup required",
    };

    setData((previous) => ({
      ...previous,
      bookings: [booking, ...previous.bookings],
    }));

    setBookingListing(null);
    setSelected(null);
    setMessage("Your booking request has been sent.");
    setTab("bookings");
  }

  function updateBooking(id: string, updates: Partial<Booking>) {
    setData((previous) => ({
      ...previous,
      bookings: previous.bookings.map((booking) =>
        booking.id === id ? { ...booking, ...updates } : booking
      ),
    }));
  }

  function createListing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newName.trim() || !newDescription.trim()) return;

    const listing: Listing = {
      id: makeId(),
      name: newName.trim(),
      category: newCategory,
      description: newDescription.trim(),
      price: Math.max(1, Number(newPrice) || 1),
      owner: "Alex Owner",
      image:
        "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=900",
    };

    setData((previous) => ({
      ...previous,
      listings: [listing, ...previous.listings],
    }));

    setNewName("");
    setNewDescription("");
    setNewPrice("50");
    setMessage("Your listing has been published.");
    setTab("listings");
  }

  function resetDemo() {
    if (!window.confirm("Reset all Hyrisont demo data?")) return;

    setData({
      listings: initialListings,
      bookings: [],
    });
    setSelected(null);
    setBookingListing(null);
    setPaymentBooking(null);
    setMessage("Demo data has been reset.");
    setTab("home");
  }

  const categories = [
    "All",
    "Outdoor",
    "Sports",
    "Tools",
    "Electronics",
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="#home"
          onClick={(event) => {
            event.preventDefault();
            setTab("home");
          }}
        >
          <span className="brand-mark">H</span>
          <span>hyrisont</span>
        </a>

        <div className="top-search">
          <span>⌕</span>
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setTab("browse");
            }}
            placeholder="Search for things to rent..."
          />
        </div>

        <div className="role-switcher">
          {(["renter", "owner", "admin"] as Role[]).map((item) => (
            <button
              type="button"
              key={item}
              className={role === item ? "role-active" : ""}
              onClick={() => switchRole(item)}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="user-panel">
            <div className="avatar">
              {currentUser.charAt(0)}
            </div>
            <div>
              <strong>{currentUser}</strong>
              <small>{role.toUpperCase()} ACCOUNT</small>
            </div>
          </div>

          <nav className="navigation">
            {[
              ["home", "⌂", "Home"],
              ["browse", "⌕", "Browse"],
              ["bookings", "▣", "My bookings"],
              ...(role === "renter"
                ? []
                : [["listings", "＋", "My listings"]]),
              ["profile", "◎", "Profile"],
            ].map(([id, icon, label]) => (
              <button
                type="button"
                key={id}
                className={tab === id ? "nav-active" : ""}
                onClick={() => {
                  setTab(id);
                  setSelected(null);
                  setBookingListing(null);
                  setPaymentBooking(null);
                }}
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <button type="button" onClick={resetDemo}>
              ↻ Reset demo data
            </button>
            <small>Hyrisont · Visby, Gotland</small>
          </div>
        </aside>

        <main className="main-content">
          {message && (
            <div className="notice">
              {message}
              <button type="button" onClick={() => setMessage("")}>
                ×
              </button>
            </div>
          )}

          {tab === "home" && (
            <>
              <section className="hero">
                <div className="hero-content">
                  <span className="eyebrow">SHARE MORE. OWN LESS.</span>
                  <h1>Everything you need.<br />Just around the corner.</h1>
                  <p>
                    Rent useful things from people nearby. Save money,
                    reduce waste and make sharing simple.
                  </p>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => setTab("browse")}
                  >
                    Explore rentals →
                  </button>
                </div>
                <div className="hero-decoration">
                  <div className="hero-circle">↗</div>
                  <span>Local sharing<br />made simple.</span>
                </div>
              </section>

              <section className="section">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">EXPLORE</span>
                    <h2>Browse categories</h2>
                  </div>
                </div>

                <div className="category-grid">
                  {categories.slice(1).map((item, index) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => {
                        setCategory(item);
                        setTab("browse");
                      }}
                    >
                      <span className="category-icon">
                        {["🏕️", "🚲", "🛠️", "📷"][index]}
                      </span>
                      <strong>{item}</strong>
                      <small>Explore items →</small>
                    </button>
                  ))}
                </div>
              </section>

              <section className="section">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">POPULAR NEAR YOU</span>
                    <h2>Discover something useful</h2>
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setTab("browse")}
                  >
                    View all →
                  </button>
                </div>

                <div className="product-grid">
                  {data.listings.slice(0, 4).map((item) => (
                    <ProductCard
                      key={item.id}
                      item={item}
                      onClick={() => setSelected(item)}
                    />
                  ))}
                </div>
              </section>
            </>
          )}

          {tab === "browse" && (
            <section className="section">
              <span className="eyebrow">FIND YOUR NEXT RENTAL</span>
              <h1 className="page-title">Explore rentals</h1>
              <p className="muted">
                Find useful items shared by people in your community.
              </p>

              <div className="filter-row">
                {categories.map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={category === item ? "filter-active" : ""}
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="product-grid">
                {visibleListings.map((item) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    onClick={() => setSelected(item)}
                  />
                ))}
              </div>

              {visibleListings.length === 0 && (
                <div className="empty-state">
                  <h3>No items found</h3>
                  <p>Try another search or category.</p>
                </div>
              )}
            </section>
          )}

          {tab === "bookings" && (
            <section className="section">
              <span className="eyebrow">YOUR RENTALS</span>
              <h1 className="page-title">Booking management</h1>

              {myBookings.length === 0 ? (
                <div className="empty-state">
                  <h3>No bookings yet</h3>
                  <p>Your bookings will appear here.</p>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => setTab("browse")}
                  >
                    Browse rentals
                  </button>
                </div>
              ) : (
                <div className="booking-list">
                  {myBookings.map((booking) => (
                    <article className="booking-card" key={booking.id}>
                      <div className="booking-main">
                        <div>
                          <span className="eyebrow">
                            BOOKING #{booking.id.slice(-6)}
                          </span>
                          <h3>{booking.listingName}</h3>
                          <p>
                            {booking.start} – {booking.end} · {booking.days} days
                          </p>
                          <p>
                            {booking.renter} → {booking.owner}
                          </p>
                          <p>
                            {booking.delivery} · {booking.deliveryStatus}
                          </p>
                        </div>
                        <div className="booking-price">
                          <strong>{money(booking.total)}</strong>
                          <Status status={booking.status} />
                        </div>
                      </div>

                      <div className="booking-actions">
                        {role === "owner" && booking.status === "Pending" && (
                          <>
                            <button
                              type="button"
                              className="primary-button"
                              onClick={() =>
                                updateBooking(booking.id, {
                                  status: "Awaiting payment",
                                })
                              }
                            >
                              Accept booking
                            </button>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                updateBooking(booking.id, {
                                  status: "Declined",
                                })
                              }
                            >
                              Decline
                            </button>
                          </>
                        )}

                        {role === "renter" &&
                          booking.status === "Awaiting payment" && (
                            <button
                              type="button"
                              className="primary-button"
                              onClick={() => setPaymentBooking(booking.id)}
                            >
                              Pay securely (test)
                            </button>
                          )}

                        {role === "owner" && booking.status === "Paid" && (
                          <button
                            type="button"
                            className="primary-button"
                            onClick={() =>
                              updateBooking(booking.id, {
                                status: "Active",
                              })
                            }
                          >
                            Start rental
                          </button>
                        )}

                        {role === "owner" && booking.status === "Active" && (
                          <button
                            type="button"
                            className="primary-button"
                            onClick={() =>
                              updateBooking(booking.id, {
                                status: "Completed",
                                deliveryStatus:
                                  booking.delivery === "Hyrisont Delivery"
                                    ? "Returned"
                                    : "Completed",
                              })
                            }
                          >
                            Complete rental
                          </button>
                        )}

                        {role === "admin" &&
                          booking.delivery === "Hyrisont Delivery" && (
                            <div className="admin-delivery">
                              <label>Delivery status</label>
                              <select
                                value={booking.deliveryStatus}
                                onChange={(event) =>
                                  updateBooking(booking.id, {
                                    deliveryStatus: event.target.value,
                                  })
                                }
                              >
                                <option>Delivery requested</option>
                                <option>Delivery scheduled</option>
                                <option>On the way</option>
                                <option>Delivered</option>
                                <option>Returned</option>
                              </select>
                              <button
                                type="button"
                                className="primary-button"
                                onClick={() =>
                                  updateBooking(booking.id, {
                                    status:
                                      booking.status === "Awaiting payment"
                                        ? "Awaiting payment"
                                        : booking.status,
                                  })
                                }
                              >
                                Save status
                              </button>
                            </div>
                          )}
                      </div>

                      <div className="price-breakdown">
                        Item rental: {money(booking.itemPrice)} · Delivery:{" "}
                        {money(booking.deliveryFee)} · Total:{" "}
                        {money(booking.total)}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === "listings" && (
            <section className="section">
              <span className="eyebrow">OWNER SPACE</span>
              <h1 className="page-title">Manage your listings</h1>

              {role === "owner" && (
                <form className="listing-form" onSubmit={createListing}>
                  <h3>Publish a new item</h3>

                  <label>Item name</label>
                  <input
                    required
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                    placeholder="e.g. Folding table"
                  />

                  <label>Category</label>
                  <select
                    value={newCategory}
                    onChange={(event) => setNewCategory(event.target.value)}
                  >
                    {categories.slice(1).map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>

                  <label>Description</label>
                  <textarea
                    required
                    value={newDescription}
                    onChange={(event) =>
                      setNewDescription(event.target.value)
                    }
                    placeholder="Describe your item..."
                  />

                  <label>Price per day (SEK)</label>
                  <input
                    type="number"
                    min="1"
                    value={newPrice}
                    onChange={(event) => setNewPrice(event.target.value)}
                  />

                  <button type="submit" className="primary-button">
                    Publish listing
                  </button>
                </form>
              )}

              <div className="product-grid">
                {data.listings
                  .filter((item) =>
                    role === "admin" ? true : item.owner === "Alex Owner"
                  )
                  .map((item) => (
                    <ProductCard
                      key={item.id}
                      item={item}
                      onClick={() => setSelected(item)}
                    />
                  ))}
              </div>
            </section>
          )}

          {tab === "profile" && (
            <section className="section">
              <span className="eyebrow">ACCOUNT</span>
              <h1 className="page-title">Your profile</h1>
              <div className="profile-card">
                <div className="avatar large">
                  {currentUser.charAt(0)}
                </div>
                <h2>{currentUser}</h2>
                <p className="muted">{role.toUpperCase()} ACCOUNT</p>
                <p>Hyrisont community member · Visby, Gotland</p>
                <div className="profile-stats">
                  <div>
                    <strong>{myBookings.length}</strong>
                    <small>Bookings</small>
                  </div>
                  <div>
                    <strong>{data.listings.filter((item) => item.owner === currentUser).length}</strong>
                    <small>Listings</small>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {selected && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <section className="modal" role="dialog" aria-modal="true">
            <button
              type="button"
              className="modal-close"
              onClick={() => setSelected(null)}
            >
              ×
            </button>
            <img src={selected.image} alt={selected.name} />
            <span className="eyebrow">{selected.category}</span>
            <h2>{selected.name}</h2>
            <p>{selected.description}</p>
            <h3>{money(selected.price)} / day</h3>
            <p className="muted">Listed by {selected.owner}</p>
            {role === "renter" && (
              <button
                type="button"
                className="primary-button full-button"
                onClick={() => {
                  setBookingListing(selected);
                  setSelected(null);
                  setMessage("");
                }}
              >
                Book this item
              </button>
            )}
          </section>
        </div>
      )}

      {bookingListing && (
        <div className="modal-backdrop">
          <section className="modal booking-modal" role="dialog" aria-modal="true">
            <button
              type="button"
              className="modal-close"
              onClick={() => setBookingListing(null)}
            >
              ×
            </button>
            <span className="eyebrow">BOOK YOUR RENTAL</span>
            <h2>{bookingListing.name}</h2>

            <label>Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />

            <label>End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />

            <label>Delivery method</label>
            <select
              value={delivery}
              onChange={(event) =>
                setDelivery(event.target.value as Delivery)
              }
            >
              <option value="Pickup">Pickup – free</option>
              <option value="Hyrisont Delivery">
                Hyrisont Delivery – SEK 50
              </option>
            </select>

            <p className="muted">
              Delivery fee is a demonstration price, not a real delivery
              service charge.
            </p>

            <button
              type="button"
              className="primary-button full-button"
              onClick={() => createBooking(bookingListing)}
            >
              Confirm booking request
            </button>
          </section>
        </div>
      )}

      {paymentBooking && (
        <div className="modal-backdrop">
          <section className="modal" role="dialog" aria-modal="true">
            <button
              type="button"
              className="modal-close"
              onClick={() => setPaymentBooking(null)}
            >
              ×
            </button>
            <span className="eyebrow">DEMO CHECKOUT</span>
            <h2>Test payment</h2>
            <p>
              This is a simulated payment for your course project.
              No real money will be charged.
            </p>
            <div className="test-payment">
              <strong>TEST MODE</strong>
              <span>Demo payment only</span>
            </div>
            <button
              type="button"
              className="primary-button full-button"
              onClick={() => {
                updateBooking(paymentBooking, {
                  status: "Paid",
                });
                setPaymentBooking(null);
                setMessage("Test payment successful. No money was charged.");
              }}
            >
              Confirm test payment
            </button>
          </section>
        </div>
      )}

      <footer className="footer">
        <strong>hyrisont</strong>
        <span>Rent what you need. Share what you have.</span>
        <small>Course project demonstration · No real payments</small>
      </footer>
    </div>
  );
}

function ProductCard({
  item,
  onClick,
}: {
  item: Listing;
  onClick: () => void;
}) {
  return (
    <article className="product-card">
      <button
        type="button"
        className="product-image-button"
        onClick={onClick}
      >
        <img src={item.image} alt={item.name} />
        <span className="image-tag">{item.category}</span>
      </button>
      <div className="product-info">
        <div>
          <h3>{item.name}</h3>
          <p>{item.owner}</p>
        </div>
        <div className="product-price">
          <strong>{money(item.price)}</strong>
          <small>/ day</small>
        </div>
        <button
          type="button"
          className="secondary-button full-button"
          onClick={onClick}
        >
          View details
        </button>
      </div>
    </article>
  );
}

function Status({ status }: { status: Status }) {
  return (
    <span className={`status status-${status.toLowerCase().replaceAll(" ", "-")}`}>
      {status}
    </span>
  );
}
