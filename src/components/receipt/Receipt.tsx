interface ReceiptOrderItemOption {
  id: string
  value_label: string
}

interface ReceiptOrderItem {
  id: string
  menu_name: string
  quantity: number
  subtotal: number
  order_item_options?: ReceiptOrderItemOption[]
}

interface ReceiptProps {
  queueNumber: string
  totalPrice: number
  orderType: string
  paymentMethod: string
  items: ReceiptOrderItem[]
  createdAt: string
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

export function Receipt({ queueNumber, totalPrice, orderType, paymentMethod, items, createdAt }: ReceiptProps) {
  const orderTypeLabel = orderType === 'dine-in' ? 'Makan di Sini' : 'Bawa Pulang'

  return (
    <div className="receipt-container hidden">
      <div className="receipt-content">
        {/* Header */}
        <div className="receipt-center receipt-bold receipt-lg">
          AYAM KALINTANG
        </div>
        <div className="receipt-center receipt-sm">
          Self-Order Kiosk
        </div>
        <div className="receipt-divider-double" />

        {/* Meta */}
        <div className="receipt-row">
          <span>{formatDate(createdAt)}</span>
          <span>{formatTime(createdAt)}</span>
        </div>
        <div className="receipt-row">
          <span>No. Antrean</span>
          <span className="receipt-bold">{queueNumber}</span>
        </div>
        <div className="receipt-row">
          <span>Tipe</span>
          <span>{orderTypeLabel}</span>
        </div>
        <div className="receipt-divider" />

        {/* Items */}
        {items.map((item) => (
          <div key={item.id} className="receipt-item">
            <div className="receipt-row">
              <span>{item.quantity}x {item.menu_name}</span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
            {item.order_item_options && item.order_item_options.length > 0 && (
              <div className="receipt-options">
                {item.order_item_options.map(o => o.value_label).join(', ')}
              </div>
            )}
          </div>
        ))}
        <div className="receipt-divider" />

        {/* Total */}
        <div className="receipt-row receipt-bold receipt-lg">
          <span>TOTAL</span>
          <span>Rp {formatCurrency(totalPrice)}</span>
        </div>
        <div className="receipt-row receipt-sm">
          <span>Metode</span>
          <span>{paymentMethod}</span>
        </div>
        <div className="receipt-divider-double" />

        {/* Footer */}
        <div className="receipt-center receipt-sm receipt-footer">
          <p>Terima kasih sudah</p>
          <p>memesan di</p>
          <p className="receipt-bold">Ayam Kalintang!</p>
        </div>
        <div className="receipt-divider-double" />

        {/* Spacer for paper cut */}
        <div className="receipt-spacer" />
      </div>
    </div>
  )
}
