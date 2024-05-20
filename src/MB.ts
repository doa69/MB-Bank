import * as playwright from 'playwright';
import solveCaptcha from './capcha/main';
import moment from 'moment-timezone';
import axios from 'axios';
interface MbBankTransactionDto {
  refNo: string;
  result: { responseCode: string; message: string; ok: boolean };
  transactionHistoryList: {
    postingDate: string; //'14/12/2023 04:29:00';
    transactionDate: string;
    accountNo: string;
    creditAmount: string;
    debitAmount: string;
    currency: 'VND';
    description: string;
    availableBalance: string;
    beneficiaryAccount: null;
    refNo: string;
    benAccountName: string;
    bankName: string;
    benAccountNo: string;
    dueDate: null;
    docId: null;
    transactionType: string;
  }[];
}
interface Payment {
  transaction_id: string;
  content: string;
  amount: number;
  date: Date;
  account_receiver: string;
}


export default class MB {
    /**
     * @readonly
     * Your MB account username.
    */
    public readonly username: string;

    /**
    * @readonly
    * Your MB account password.
    */
    public readonly password: string;

    /**
    * @private
    * Your non-unique, time-based Device ID.
    */
      private deviceId: string | null | undefined;
    /**
     * @private
     * MB-returned Session ID. Use it to validate the request.
    */
    private sessionId: string | null | undefined;

    /**
     * Login to your MB account via username and password.
     * @param data - Your MB Bank login credentials: username and password.
     * @param data.username Your MB Bank login username, usually your registered phone number.
     * @param data.password Your MB Bank login password.
     */
    public constructor(data: { username: string, password: string }) {
        if (!data.username || !data.password) throw new Error("You must define at least a MB account to use with this library!");

        this.username = data.username;
        this.password = data.password;
    }

  private async login() {
    const browser = await playwright.chromium.launch({
      headless: true,
    });

    try {
      const context = await browser.newContext();
      const page = await context.newPage();

      console.log('Mb bank login...');
      const getCaptchaWaitResponse = page.waitForResponse(
        '**/retail-web-internetbankingms/getCaptchaImage',
        { timeout: 60000 },
      );
      await page.goto('https://online.mbbank.com.vn/pl/login');

      const getCaptchaJson = await getCaptchaWaitResponse.then((d) => d.json());
      const captchaText = await solveCaptcha(getCaptchaJson.imageString);

      await page.locator('#form1').getByRole('img').click();
      await page.getByPlaceholder('Tên đăng nhập').click();
      await page.getByPlaceholder('Tên đăng nhập').fill(this.username);
      await page.getByPlaceholder('Tên đăng nhập').press('Tab');
      await page.getByPlaceholder('Nhập mật khẩu').fill(this.password);
      await page.getByPlaceholder('NHẬP MÃ KIỂM TRA').click();
      await page.getByPlaceholder('NHẬP MÃ KIỂM TRA').fill(captchaText);

      const loginWaitResponse = page.waitForResponse(
        new RegExp('.*doLogin$', 'g'),
      );

      await page.getByRole('button', { name: 'Đăng nhập' }).click();

      const loginJson = await loginWaitResponse.then((d) => d.json());

      if (loginJson.result.responseCode == 'GW283') {
        throw new Error('Wrong captcha');
        //
      }
      if (!loginJson.result.ok)
        throw new Error(loginJson.result.message.message);

      this.sessionId = loginJson.sessionId;
      this.deviceId = loginJson.cust.deviceId;
      await browser.close();
      console.log('MBBankService login success');
    } catch (error) {
      await browser.close();
      console.error('MBBankService login error', error);
      throw error;
    }
  }
  public async getHistory():Promise<Payment[]> {
    if (!this.sessionId) await this.login();

    const fromDate = moment()
      .tz('Asia/Ho_Chi_Minh')
      .subtract(7, 'days')
      .format('DD/MM/YYYY');
    const toDate = moment().tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY');
    const refNo =
      this.username.toUpperCase() +
      moment().tz('Asia/Ho_Chi_Minh').format('DDMMYYYYHHmmssSSS');
    const dataSend = {
      accountNo: this.username,
      fromDate,
      toDate,
      sessionId: this.sessionId,
      refNo,
      deviceIdCommon: this.deviceId,
    };
    try {
      const { data } = await axios.post<MbBankTransactionDto>(
        'https://online.mbbank.com.vn/api/retail-transactionms/transactionms/get-account-transaction-history',

        dataSend,
        {
          headers: {
            'X-Request-Id': moment()
              .tz('Asia/Ho_Chi_Minh')
              .format('DDMMYYYYHHmmssSSS'),
            'Cache-Control': 'no-cache',
            Accept: 'application/json, text/plain, */*',
            Authorization:
              'Basic RU1CUkVUQUlMV0VCOlNEMjM0ZGZnMzQlI0BGR0AzNHNmc2RmNDU4NDNm',
            Deviceid: this.deviceId,
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            Origin: 'https://online.mbbank.com.vn',
            Referer: 'https://online.mbbank.com.vn/',
            Refno: refNo,
            'Content-Type': 'application/json; charset=UTF-8',
          },
        },
      );

      if (data.result.responseCode === 'GW200') {
        throw new Error('Session expired');
      }

      if (!data.result.ok) throw new Error(data.result.message);

      return data.transactionHistoryList.map((transaction: any) => ({
        transaction_id: transaction.refNo,
        amount: Number(transaction.creditAmount),
        content: transaction.description,
        date: moment
          .tz(
            transaction.transactionDate,
            'DD/MM/YYYY HH:mm:ss',
            'Asia/Ho_Chi_Minh',
          )
          .toDate(),

        account_receiver: transaction.accountNo,
      }));
    } catch (error) {
      console.error(error);

      try {
        await this.login();
      } catch (error) {
        console.error(error);
      }

      throw error;
    }
  }

}
