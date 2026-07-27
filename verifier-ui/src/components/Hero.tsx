import { ArrowRight, Check } from './Icons.js';

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="wrap hero__grid">
        <div className="hero__copy">
          <h1 className="display hero__title">
            Exclusive access.<br />
            Absolute <span className="em">silence</span>.
          </h1>
          <p className="lede hero__lede">
            Verify your eligibility once with a trusted Issuer, then prove your status to any Verifier on
            Midnight. The Verifier learns a single result, <span className="ok-text">verified</span>, and
            never sees your name, your birthdate, or your documents.
          </p>
        </div>

        <div className="proofcard">
          <div className="proofcard__inner">
            <div className="pv-row">
              <div className="pv-box">
                <div className="pv-lbl">you keep</div>
                <div className="pv-val hidden">1998 04 25</div>
                <div className="pv-sub">birthdate, never sent</div>
              </div>
              <div className="pv-mid">
                <ArrowRight size={18} className="pv-arrow" />
                <span>proof</span>
              </div>
              <div className="pv-box">
                <div className="pv-lbl">the venue sees</div>
                <div className="pv-val pv-check">
                  <Check size={15} /> verified
                </div>
                <div className="pv-sub">and an opaque commitment</div>
              </div>
            </div>
          </div>
          <p className="proofcard__cap">The chain only ever learns the one fact you chose to prove.</p>
        </div>
      </div>
    </section>
  );
}
