import crypto from 'crypto'

/**
 * BCA SNAP API Client (Standar Nasional Open API Pembayaran)
 * Specialized for Dynamic QRIS MPM.
 */
export class BcaSnapClient {
  private clientId: string
  private clientSecret: string
  private privateKey: string // PKCS#8 format
  private partnerId: string
  private baseUrl: string
  private isSimulation: boolean

  constructor() {
    this.clientId = process.env.BCA_CLIENT_ID || ''
    this.clientSecret = process.env.BCA_CLIENT_SECRET || ''
    this.privateKey = (process.env.BCA_PRIVATE_KEY || '').replace(/\\n/g, '\n')
    this.partnerId = process.env.BCA_PARTNER_ID || ''
    this.baseUrl = process.env.BCA_BASE_URL || 'https://sandbox.bca.co.id'
    
    // Auto-enable simulation if credentials are missing
    this.isSimulation = !this.clientId || !this.privateKey || process.env.BCA_SIMULATION === 'true'
  }

  /**
   * Generates the Asymmetric Signature for OAuth Access Token (B2B)
   */
  private generateAsymmetricSignature(timestamp: string): string {
    const stringToSign = `${this.clientId}|${timestamp}`
    const sign = crypto.createSign('SHA256')
    sign.update(stringToSign)
    return sign.sign(this.privateKey, 'base64')
  }

  /**
   * Generates the Symmetric Signature for Service Requests
   */
  private generateSymmetricSignature(
    method: string,
    endpoint: string,
    token: string,
    body: object,
    timestamp: string
  ): string {
    const minifiedBody = JSON.stringify(body)
    const bodyHash = crypto.createHash('sha256').update(minifiedBody).digest('hex').toLowerCase()
    const stringToSign = `${method.toUpperCase()}:${endpoint}:${token}:${bodyHash}:${timestamp}`
    
    return crypto
      .createHmac('sha512', this.clientSecret)
      .update(stringToSign)
      .digest('base64')
  }

  /**
   * Phase 1: Get B2B Access Token
   */
  async getAccessToken(): Promise<string> {
    if (this.isSimulation) return 'simulated_access_token'

    const timestamp = new Date().toISOString()
    const signature = this.generateAsymmetricSignature(timestamp)

    const response = await fetch(`${this.baseUrl}/v1.0/access-token/b2b`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CLIENT-KEY': this.clientId,
        'X-TIMESTAMP': timestamp,
        'X-SIGNATURE': signature,
      },
      body: JSON.stringify({ grantType: 'client_credentials' }),
    })

    const data = await response.json()
    if (!response.ok) throw new Error(`BCA Auth Failed: ${data.errorMessage || response.statusText}`)
    
    return data.accessToken
  }

  /**
   * Phase 2: Generate Dynamic QRIS
   */
  async generateQR(orderId: string, amount: number): Promise<string> {
    if (this.isSimulation) {
      // Return a valid-looking EMVCo QRIS string for Ayam Kalintang (Simulated)
      // This is a dummy string that starts with the standard QRIS prefix
      return `00020101021226660014ID.CO.BCA.WWW011893600002000001234502030010303UMI51440014ID.CO.QRIS.WWW0215ID10200000000010303UMI5204581253033605405${amount}.005802ID5915AYAM KALINTANG6007BANDUNG61054011562070703A016304`
    }

    const token = await this.getAccessToken()
    const timestamp = new Date().toISOString()
    const endpoint = '/v1.0/qr/qr-mpm-generate'
    
    const body = {
      partnerReferenceNo: orderId,
      amount: {
        value: amount.toFixed(2),
        currency: 'IDR',
      },
      feeAmount: {
        value: "0.00",
        currency: 'IDR'
      },
      merchantId: process.env.BCA_MERCHANT_ID,
      terminalId: process.env.BCA_TERMINAL_ID,
    }

    const signature = this.generateSymmetricSignature('POST', endpoint, token, body, timestamp)

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-TIMESTAMP': timestamp,
        'X-SIGNATURE': signature,
        'X-PARTNER-ID': this.partnerId,
        'X-EXTERNAL-ID': Math.floor(Math.random() * 1000000).toString(),
        'CHANNEL-ID': '95051',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    if (!response.ok) throw new Error(`BCA QR Generate Failed: ${data.errorMessage || response.statusText}`)

    return data.qrContent // The raw EMVCo string
  }
}

export const bcaClient = new BcaSnapClient()
