/**
 * The barrio horizon at the foot of every page band: a far mountain range, a nipa hut on a terraced
 * hill, a sun and two clouds, and the page ground rising in front. Pure markup (no hooks, no JS): its
 * motion is CSS transform/opacity gated in globals.css (reduced motion, the Settings switch, save-data
 * and low-end devices all leave it still). The left of the scene stays low so the title and subtitle
 * never sit on a shape; the sun, clouds and hut live in the right 40%.
 */
export default function BandScene() {
  return (
    <div aria-hidden="true" data-slot="band-scene" className="band-scene">
      <span className="scene-sun" />
      <span className="scene-cloud scene-cloud-a" />
      <span className="scene-cloud scene-cloud-b" />
      <svg className="scene-layer scene-far" viewBox="0 0 1440 100" preserveAspectRatio="none" focusable="false">
        <path d="M0 100V72L110 66 250 76 430 54 570 70 740 44 910 66 1090 36 1250 60 1440 38V100Z" />
      </svg>
      <svg className="scene-hut" viewBox="0 0 40 30" focusable="false">
        <path d="M2 15 20 2 38 15ZM8 15h24v10H8Z" />
        <path d="M11 25v5M29 25v5" strokeWidth="2.5" />
      </svg>
      <svg className="scene-layer scene-mid" viewBox="0 0 1440 100" preserveAspectRatio="none" focusable="false">
        <path d="M0 100V84C170 74 330 86 530 77S900 60 1120 68 1360 58 1440 54V100Z" />
        <path className="scene-terrace" d="M0 92C190 84 340 94 540 87S910 72 1130 79 1360 70 1440 67M0 98C220 91 360 99 560 94S930 83 1150 89 1370 82 1440 80" />
      </svg>
      <svg className="scene-layer scene-near" viewBox="0 0 1440 100" preserveAspectRatio="none" focusable="false">
        <path d="M0 100V93C250 86 430 97 710 92S1190 82 1440 88V100Z" />
      </svg>
    </div>
  );
}
