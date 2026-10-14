
/* Circle voluntary gratitude payment gate.
   Requires Supabase JS v2 and `sb`.
*/

window.CirclePaymentGate = (() => {
  const QR = 'phonepe-qr.png';
  const AMOUNT = 19;
  const DAY = 7;

  function ensureModal() {
    if (document.getElementById('circlePayOverlay')) return;

    const style = document.createElement('style');

    style.textContent = `
      #circlePayOverlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
        background: rgba(16,28,24,.56);
        backdrop-filter: blur(7px);
        display: none;
        place-items: center;
        padding: 16px;
        font-family: 'DM Sans', sans-serif;
      }

      #circlePayOverlay.open {
        display: grid;
      }

      #circlePayOverlay .cp-card {
        position: relative;
        width: min(460px, 100%);
        max-height: 94vh;
        overflow: auto;
        background: #f6f4ef;
        border: 1px solid #ddd9d0;
        border-radius: 24px;
        padding: 24px;
        box-shadow: 0 24px 90px #101c1840;
        color: #171716;
      }

      #circlePayOverlay .cp-close {
        position: absolute;
        right: 16px;
        top: 14px;
        width: 34px;
        height: 34px;
        border: 1px solid #ddd9d0;
        border-radius: 50%;
        background: #fffdf8;
        color: #163d35;
        font: 20px 'DM Sans', sans-serif;
        cursor: pointer;
        display: grid;
        place-items: center;
      }

      #circlePayOverlay .cp-payee {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: .02em;
        text-align: center;
        color: #163d35;
        margin: -4px 0 12px;
      }

      #circlePayOverlay .cp-kicker {
        font-size: 10px;
        letter-spacing: .18em;
        text-transform: uppercase;
        color: #163d35;
        font-weight: 700;
      }

      #circlePayOverlay h2 {
        font: 500 31px 'Playfair Display', serif;
        margin: 9px 0;
      }

      #circlePayOverlay p {
        font-size: 12px;
        line-height: 1.7;
        color: #74716a;
      }

      #circlePayOverlay .cp-amount {
        font: 500 34px 'Playfair Display', serif;
        color: #163d35;
        margin: 10px 0;
      }

      #circlePayOverlay .cp-qr {
        display: block;
        width: min(245px, 100%);
        aspect-ratio: 1;
        object-fit: contain;
        margin: 14px auto;
        background: white;
        border: 1px solid #ddd9d0;
        border-radius: 16px;
        padding: 8px;
      }

      #circlePayOverlay .cp-input {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid #ddd9d0;
        border-radius: 11px;
        padding: 12px;
        background: #fffdf8;
        font: 12px 'DM Sans', sans-serif;
        margin: 5px 0 10px;
      }

      #circlePayOverlay .cp-btn {
        border: 0;
        border-radius: 999px;
        background: #163d35;
        color: white;
        padding: 13px 17px;
        font: 700 12px 'DM Sans', sans-serif;
        width: 100%;
        cursor: pointer;
      }

      #circlePayOverlay .cp-btn:disabled {
        opacity: .6;
        cursor: not-allowed;
      }

      #circlePayOverlay .cp-status {
        font-size: 11px;
        line-height: 1.6;
        color: #163d35;
        min-height: 18px;
        margin-top: 10px;
      }

      #circlePayOverlay .cp-foot {
        font-size: 10px;
        color: #74716a;
      }
    `;

    document.head.append(style);

    const el = document.createElement('div');
    el.id = 'circlePayOverlay';

    el.innerHTML = `
      <section
        class="cp-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cpTitle"
      >
        <button
          type="button"
          class="cp-close"
          id="cpClose"
          aria-label="Close payment window"
          title="Close"
        >×</button>

        <div class="cp-kicker">Circle · gratitude access</div>

        <h2 id="cpTitle">A small thank-you.</h2>

        <p>
          Your learning space is supported by mentor Adhiraag.
          Please contribute a minimum of ₹19 for the next 7 days
          of access. After payment, send a request; access starts
          once your mentor confirms it.
        </p>

        <div class="cp-amount">
          ₹19
          <span style="font:11px 'DM Sans';color:#74716a">
            / 7 days
          </span>
        </div>

        <img
          class="cp-qr"
          src="${QR}"
          alt="PhonePe payment QR code"
          onerror="
            this.style.display='none';
            document.getElementById('cpQrMissing').style.display='block';
          "
        >

        <div class="cp-payee">
          RAMESWARAPU ADINARAYANA
        </div>

        <p
          id="cpQrMissing"
          style="display:none;color:#8b3434"
        >
          QR image not found. Add
          <b>${QR}</b>
          beside your HTML files in GitHub.
        </p>

        <p style="text-align:center">
          Scan with PhonePe / any UPI app. Then enter the UPI
          transaction reference (if available).
        </p>

        <label for="cpTxn" class="cp-foot">
          UPI transaction reference (optional)
        </label>

        <input
          id="cpTxn"
          class="cp-input"
          maxlength="100"
          placeholder="e.g. UTR / transaction ID"
        >

        <button id="cpRequest" class="cp-btn">
          I’ve paid — send approval request
        </button>

        <div
          id="cpStatus"
          class="cp-status"
          aria-live="polite"
        ></div>

        <p class="cp-foot">
          This is a manual UPI payment workflow, not an automatic
          payment gateway. Do not submit banking PINs or OTPs.
        </p>
      </section>
    `;

    document.body.append(el);

    // Close button
    el.querySelector('#cpClose').addEventListener('click', () => {
      el.classList.remove('open');
    });

    // Close when clicking outside the payment card
    el.addEventListener('click', event => {
      if (event.target === el) {
        el.classList.remove('open');
      }
    });

    // Close with Escape key
    document.addEventListener('keydown', event => {
      if (
        event.key === 'Escape' &&
        el.classList.contains('open')
      ) {
        el.classList.remove('open');
      }
    });
  }

  async function ensureAccess(sb, user, profile, { onPending } = {}) {
    ensureModal();

    const { data: grant, error } = await sb
      .from('student_payment_access')
      .select('paid_until')
      .eq('student_user_id', user.id)
      .maybeSingle();

    if (error) {
      throw new Error(
        'Could not check payment access. Apply the SQL setup and retry.'
      );
    }

    if (
      grant?.paid_until &&
      new Date(grant.paid_until).getTime() > Date.now()
    ) {
      return true;
    }

    const overlay = document.getElementById('circlePayOverlay');
    const status = document.getElementById('cpStatus');
    const button = document.getElementById('cpRequest');

    overlay.classList.add('open');
    status.textContent = '';
    button.disabled = false;
    button.textContent = 'I’ve paid — send approval request';

    const { data: pending, error: pendingError } = await sb
      .from('student_payment_requests')
      .select('id,status,created_at')
      .eq('student_user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingError) {
      status.textContent =
        'Payment tables are not ready yet. Ask the site owner to run circle_payment_setup.sql.';
      button.disabled = true;
    } else if (pending) {
      status.textContent =
        'Your request is waiting for mentor approval. Click Check status to check again.';
      button.textContent = 'Check approval status';
    }

    button.onclick = async () => {
      button.disabled = true;
      status.textContent = 'Checking…';

      try {
        const { data: latest, error: accessError } = await sb
          .from('student_payment_access')
          .select('paid_until')
          .eq('student_user_id', user.id)
          .maybeSingle();

        if (accessError) throw accessError;

        if (
          latest?.paid_until &&
          new Date(latest.paid_until).getTime() > Date.now()
        ) {
          status.textContent = 'Approved. You can continue.';
          location.reload();
          return;
        }

        const { data: exists, error: existsError } = await sb
          .from('student_payment_requests')
          .select('id')
          .eq('student_user_id', user.id)
          .eq('status', 'pending')
          .limit(1)
          .maybeSingle();

        if (existsError) throw existsError;

        if (exists) {
          status.textContent =
            'Your request is still pending. Your mentor must approve it before access opens.';
          button.disabled = false;
          button.textContent = 'Check approval status';
          return;
        }

        const { error: insertError } = await sb
          .from('student_payment_requests')
          .insert({
            student_user_id: user.id,
            student_name:
              profile?.full_name ||
              user.user_metadata?.full_name ||
              user.email,
            student_email: user.email || '',
            cohort: profile?.cohort || null,
            amount: AMOUNT,
            transaction_reference:
              document.getElementById('cpTxn').value.trim() || null,
            status: 'pending'
          });

        if (insertError) throw insertError;

        status.textContent =
          'Request sent to your mentor. Access will unlock after approval.';
        button.textContent = 'Check approval status';
        button.disabled = false;
      } catch (error) {
        status.textContent =
          error.message ||
          'Could not send request. Check the SQL setup and try again.';
        button.disabled = false;
      }
    };

    return false;
  }

  return { ensureAccess };
})();

