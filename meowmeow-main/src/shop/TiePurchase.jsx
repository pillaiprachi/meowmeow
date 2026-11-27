import {useLayoutEffect, useRef, useState} from 'react';
import {useOpenBag} from './Bag';
import {bag, PRODUCTS} from './store';

const TURN = 45;
const normalize = angle => ((angle % 360) + 360) % 360;
const describeAngle = (tie, angle) => `${tie.name} at ${normalize(angle)} degrees clockwise from upright`;

function TiePuzzle({tie, dialog, onClose, onMatch}) {
  const [target] = useState(() => Math.floor(Math.random() * 8) * TURN);
  const [angle, setAngle] = useState(() => normalize(target + (1 + Math.floor(Math.random() * 7)) * TURN));
  const [moved, setMoved] = useState(false);
  const [feedback, setFeedback] = useState('');
  const left = useRef(null);

  useLayoutEffect(() => {
    dialog.current.showModal();
    left.current.focus();
  }, [dialog]);

  function rotate(delta) {
    setAngle(current => current + delta);
    setFeedback('');
    setMoved(true);
  }

  function verify() {
    if (normalize(angle) !== target) {
      setFeedback('The angles differ. Try another turn.');
      return;
    }
    dialog.current.close();
    onMatch();
  }

  function handleKey(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    rotate(event.key === 'ArrowLeft' ? -TURN : TURN);
  }

  return (
    <dialog className="tie-captcha" id="tie-captcha" aria-labelledby="captcha-title" aria-describedby="captcha-instructions"
      ref={dialog} onClose={onClose} onKeyDown={handleKey}>
      <header className="captcha-header">
        <h2 id="captcha-title">Match the tie</h2>
        <p id="captcha-instructions">Rotate your tie to match the reference.</p>
        <button className="captcha-close" type="button" aria-label="Close tie puzzle" onClick={() => dialog.current.close()}>×</button>
      </header>
      <div className="captcha-body">
        <div className="captcha-boards">
          <figure>
            <figcaption>Reference</figcaption>
            <div className="captcha-board" id="captcha-reference" role="img" aria-label={describeAngle(tie, target)} style={{'--angle': `${target}deg`}}>
              <img src={tie.img} alt="" draggable="false" />
            </div>
          </figure>
          <figure>
            <figcaption>Your tie</figcaption>
            <div className="captcha-board" id="captcha-player" role="img" aria-label={describeAngle(tie, angle)} style={{'--angle': `${angle}deg`}}>
              <img src={tie.img} alt="" draggable="false" />
            </div>
            <div className="captcha-rotate" role="group" aria-label="Rotate the tie">
              <button type="button" data-rotate="-45" aria-label="Rotate left" ref={left} onClick={() => rotate(-TURN)}><span aria-hidden="true">↶</span> Left</button>
              <button type="button" data-rotate="45" aria-label="Rotate right" onClick={() => rotate(TURN)}><span aria-hidden="true">↷</span> Right</button>
            </div>
          </figure>
        </div>
        <span className="captcha-sr" id="captcha-angle" role="status">{moved ? describeAngle(tie, angle) : ''}</span>
        <div className="captcha-footer">
          <p className="captcha-feedback" id="captcha-feedback" role="status">{feedback}</p>
          <button className="captcha-verify" type="button" onClick={verify}>Verify</button>
        </div>
      </div>
    </dialog>
  );
}

export function TiePurchase({id}) {
  const puzzle = useRef(null);
  const [matching, setMatching] = useState(false);
  const [added, setAdded] = useState(false);
  const openBag = useOpenBag();
  const tie = PRODUCTS[id];

  function addToBag() {
    bag.add(id);
    setAdded(true);
    openBag();
  }

  return (
    <>
      <button className="add" id="add" type="button" aria-haspopup="dialog" onClick={() => setMatching(true)}>ADD TO BAG</button>
      <small id="add-status" role="status" style={{opacity: .7}}>{added ? `${tie.name} added to your bag.` : ''}</small>
      {matching && <TiePuzzle tie={tie} dialog={puzzle} onClose={() => setMatching(false)} onMatch={addToBag} />}
    </>
  );
}
