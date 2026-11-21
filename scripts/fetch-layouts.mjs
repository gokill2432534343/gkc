// One-off helper: downloads the map layout images from hens333.com/callouts into A:\gkc\layouts-download
// Hens333 gave permission to use them in GKC, the images are by Lethia. Run it once yourself:
//   node scripts/fetch-layouts.mjs
// It saves <realm>/<map>/<number>.webp so the images can be looked at and sorted before they go into GKC.
import { mkdir, writeFile, access } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const BASE = 'https://hens333.com/_astro/'
const OUT = resolve(process.cwd(), '..', 'layouts-download')

const DATA = `
Autohaven Wreckers
- azarovs-resting-place.CEf4Ha8P_1FrEMq.webp azarovs-resting-place.DAMbQtKX_rkWb.webp azarovs-resting-place.CxGQEaZN_Z1bwEtY.webp
- blood-lodge.BofHLGVr_ZJQPDQ.webp blood-lodge.DkPvwiF2_1GHfbY.webp blood-lodge.Bnko2EEL_KUg8h.webp
- gas-heaven.xCEwtA7A_nfUTN.webp gas-heaven.DHbI_QBf_Z2ha2j9.webp gas-heaven.D4yoxIH4_bibXc.webp
- wreckers-yard.DbljbH5Q_28wAJD.webp wreckers-yard.CiMvsUzu_1nvSFc.webp wreckers-yard.BUWOPA79_2mM5qp.webp
- wretched-shop.D-i8KBIf_1iTHx0.webp wretched-shop.a8HbDfX3_173cP4.webp wretched-shop.DQKvVo1e_Z2fji9w.webp
Backwater Swamp
- grim-pantry.DxDZLeMl_tobUx.webp grim-pantry.C7NzxcfC_1H4K2F.webp grim-pantry.Cx1OJC9x_Z2o2IHp.webp
- the-pale-rose.DI_f5s_n_Z1Lrhug.webp the-pale-rose.C8d7KtfR_c1r0Q.webp the-pale-rose.ngB8Wlnj_1Sw4Aw.webp
Coldwind Farm
- fractured-cowshed.BmClJSEp_Z2aHc4S.webp fractured-cowshed.C08UPeDJ_1xtofE.webp fractured-cowshed.Cu8PaykB_Zdmdwa.webp
- rancid-abattoir.DcUlswqJ_Z1T7mRq.webp rancid-abattoir.X7qr4jb9_7RYL5.webp rancid-abattoir.CDpeWezo_1WsdGS.webp
- rotten-fields.CHu4V1IZ_1iXMYF.webp rotten-fields.CCfbpyvg_1z2HtR.webp rotten-fields.BtxYb-8S_a1OBc.webp
- the-thompson-house.Bhh10PB3_15oNDM.webp the-thompson-house.CSX08qWS_ZQMCYB.webp the-thompson-house.DepW0qy-_16n4IL.webp
- torment-creek.BYJw6xw3_84uhy.webp torment-creek.DsyQPjyv_Z1tScc5.webp torment-creek.CXTaHHFj_ZMSKQd.webp
Crotus Prenn Asylum
- disturbed-ward.DtW-zlfg_wyhEk.webp disturbed-ward.DJ2fOOpP_ZH6CWl.webp disturbed-ward.DjLZqw8k_Z1PcXhn.webp
- father-campbells-chapel.Cr-ZS231_zeOi5.webp father-campbells-chapel.C4YC9dxm_ZnbJjw.webp father-campbells-chapel.BsJlKQi7_Z1FuYS.webp
Decimated Borgo
- the-shattered-square.D8t2eTH5_Z2oFOuE.webp the-shattered-square.DML2bUVu_Z1vFker.webp the-shattered-square.7Cocd2Wy_16drW8.webp
- forgotten-ruins.BsDV4h7Z_Z20l0uW.webp forgotten-ruins.DpanUfva_Z1pC2RP.webp forgotten-ruins.RRPcmcH6_8qbf8.webp
Dvarka Deepwood
- toba-landing.DgKa9OgI_23UYQV.webp toba-landing.DdNiSqU3_Z1GNo1d.webp toba-landing.DZGmC9n3_15gNhW.webp
- nostromo-wreckage.B91fxKA2_EdbYW.webp nostromo-wreckage.CYnbp44y_Z2wFhev.webp nostromo-wreckage.B3CrLa4S_1fpPV3.webp
Forsaken Boneyard
- eyrie-of-crows.DzekryBj_Z2dJJ6y.webp eyrie-of-crows.67PIUnhX_6HgGW.webp eyrie-of-crows.dHp7GX97_Z1hMcew.webp
- dead-sands.CoSjDQP1_YRgUL.webp dead-sands.GyOMGOjd_Z1HWS9A.webp dead-sands.D1jFRGBg_1nJ5Lz.webp
Gideon Meat Plant
- the-game.k8LszIcR_ZYfPKz.webp the-game.Bh_X0qRU_Wp649.webp the-game.D_SCy6ge_Pc27N.webp
Grave of Glenvale
- dead-dawg-saloon.4q69leHs_26N4Fg.webp dead-dawg-saloon.CcRcy6oJ_viH2r.webp dead-dawg-saloon.u5pC1H24_ZTA99H.webp
Hawkins National Laboratory
- the-underground-complex.ClTSokZM_Z1qLk60.webp the-underground-complex.DdEJ5E4J_Z6DUwr.webp the-underground-complex.CQ4uBR8k_ZQ25v7.webp
Lerys Memorial Institute
- treatment-theatre.DXCGJEUA_Z1vk5GV.webp treatment-theatre.BuC2TLs7_Z2UGDQ.webp treatment-theatre.DokWlkvk_ZGIADN.webp
MacMillan Estate
- coal-tower.B6Izm6ck_ZsA0VD.webp coal-tower.DRxuJFVh_1fAP1p.webp coal-tower.CQs7kukC_oBbnJ.webp
- coal-tower-ii.Dt7GfYRl_2b5Vd6.webp coal-tower-ii.DWHOlDx8_1AlTNP.webp coal-tower-ii.CTU8JvBe_Z4Hxbz.webp
- groaning-storehouse.fQTS9mJT_Z1CDlgR.webp groaning-storehouse.W4xM31rj_Z273arR.webp groaning-storehouse.B24eE_na_Zvjjfc.webp
- groaning-storehouse-ii.CMmAfi-K_ZBms3I.webp groaning-storehouse-ii.b-np5GgO_2ubWSR.webp groaning-storehouse-ii.CEfb1Ae1_Z2ri9O7.webp
- ironworks-of-misery.BXbW5LNb_Z1jGUWX.webp ironworks-of-misery.CUqJOkB6_Z1WySf2.webp ironworks-of-misery.C6MfdZBN_ZOzYGq.webp
- ironworks-of-misery-ii.Bngn96tK_1Gvp1j.webp ironworks-of-misery-ii.B6t79SI__ZVG1QD.webp ironworks-of-misery-ii.CStC24yK_Z2tuukQ.webp
- shelter-woods.B0t9wT2a_1Pv1qm.webp shelter-woods.CYLOjMVY_PE1NJ.webp shelter-woods.CiZAF9-E_Z2kzhmB.webp
- shelter-woods-ii.BJcZC_-I_fcssm.webp shelter-woods-ii.4ULqNwNG_Z12tRKl.webp shelter-woods-ii.Bv2DSK_m_Z1fEDnS.webp
- suffocation-pit.B2TGGZtz_1qNgEm.webp suffocation-pit.CRSh0Zpg_2m9wE8.webp suffocation-pit.BqJhkz9A_ROH0G.webp
- suffocation-pit-ii.KFqcMuCu_ZFvdqJ.webp suffocation-pit-ii.BTqShV2a_bA1dX.webp suffocation-pit-ii.CdB2I9KA_Z1YQLJx.webp
Ormond
- mount-ormond-resort.DKr8kuuY_13vPgN.webp mount-ormond-resort.CQ-FuKcI_Z1PGc2j.webp mount-ormond-resort.DkwF3-sf_Z8j3jO.webp
- mount-ormond-resort-ii.BBqGqPm2_Z1dXRyH.webp mount-ormond-resort-ii.BvEV0JXx_Zlmkl.webp mount-ormond-resort-ii.BQc2ry0m_2mrE4E.webp
- mount-ormond-resort-iii.BRD7Lzlr_Z2kUE1e.webp mount-ormond-resort-iii.B7HBTaJX_2aSh2b.webp mount-ormond-resort-iii.YzWEMiqS_Z1uxJCq.webp
- ormond-lake-mine.8nXXz3wA_wNdDm.webp ormond-lake-mine.Ba1vo9yH_7xtaq.webp ormond-lake-mine.BvtfJzHf_Zjelzf.webp
Raccoon City
- rpd-east-wing.CI_1Bknc_bbbkA.webp rpd-east-wing.D7YI5ASQ_Z2cKtWV.webp rpd-east-wing.DIo3tR9h_11vTlA.webp
- rpd-west-wing.DFlniwnz_CTK00.webp rpd-west-wing.CuwfqXgp_1aIfhJ.webp rpd-west-wing.BqZaMPXJ_3JdYp.webp
Red Forest
- mothers-dwelling.tYgT-aOX_1fOg5.webp mothers-dwelling.BsyXSX-b_Zw9NoG.webp mothers-dwelling.C7AUShRn_Z16kMJp.webp
- temple-of-purgation.CwZv8Ll8_Z11VIIn.webp temple-of-purgation.C61WBlzB_lqOSc.webp temple-of-purgation.Dw4oQyff_Z136zlE.webp
Silent Hill
- midwich-elementary-school.LS-jVZrz_dqvj3.webp midwich-elementary-school.dvyux0gT_Z2fHVFJ.webp midwich-elementary-school.C0P0UMnN_2igd7P.webp
Sleepless District
- tricksters-delusion.C8nnUhvH_ZVWn3k.webp tricksters-delusion.C3Wmvn8N_Z1bevCm.webp tricksters-delusion.Cib6LHzh_uyLvR.webp
Springwood Preschool
- badham-preschool-i.CZTCXDSx_1xzqvp.webp badham-preschool-i.Buf2WkhJ_tFxii.webp badham-preschool-i.BKIb0-n0_Zj3fUA.webp
- badham-preschool-ii.C8lQHKR3_Z1WmtqL.webp badham-preschool-ii.D991kXkS_18ubni.webp badham-preschool-ii.anig0sKX_Z2pVH1c.webp
- badham-preschool-iii.Dkoczx5X_1DDWJK.webp badham-preschool-iii.BWXCxaAG_1lIpl9.webp badham-preschool-i.BKIb0-n0_Zj3fUA.webp
- badham-preschool-iv.DDcM533H_Z1pNu3p.webp badham-preschool-iv.udNybBco_Z1J2UG.webp badham-preschool-iv.Bx5w1zND_Z2HadF.webp
- badham-preschool-v.CAdIHa2e_2elbF5.webp badham-preschool-v.DLjPbnTV_Z1hcVAM.webp badham-preschool-v.CdpNLbM__2kIFiT.webp
Yamaoka Estate
- family-residence.DzRQ4mmJ_1P15jS.webp family-residence.Dslh8E_-_Z1rak8W.webp family-residence.DMXNVsAo_ZEB4L4.webp
- family-residence-ii.Dp1kwJDC_Tdaw1.webp family-residence-ii.Cj_wquQ7_1UGXrR.webp family-residence-ii.Fw99aLed_ZQzvLj.webp
- sanctum-of-wrath.B-nnDKMu_1uYYeq.webp sanctum-of-wrath.DkJVoWZ7_ZQXAjL.webp sanctum-of-wrath.DFXcDoZE_6PfHb.webp
- sanctum-of-wrath-ii.DKyuolci_Z1pU30X.webp sanctum-of-wrath-ii.CvUCENyT_ZtrbOe.webp sanctum-of-wrath-ii.DLqxwqWp_Za04iq.webp
Withered Isle
- garden-of-joy.CBPwdw6l_qCTTO.webp garden-of-joy.BmCf-ru8_bPD79.webp garden-of-joy.ByAPUBzo_11JcOG.webp
- greenville-square.DU6lnFqJ_21yfzB.webp greenville-square.Ds5A5h9E_ZvLCtL.webp greenville-square.mhejHh-J_XfTlR.webp
- fallen-refuge.C3z_V0OH_ktQyD.webp fallen-refuge.BH43f820_1SOwuu.webp fallen-refuge.DQVGHe41_tXPyH.webp
- freddy-fazbears-pizza.DBWBpWBT_1tFBWL.webp freddy-fazbears-pizza.C8sJzVPx_Z1um4C0.webp freddy-fazbears-pizza.P0KUYQE9_1TRgsy.webp
`

const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const jobs = []
let realm = ''
for (const raw of DATA.split('\n')) {
  const line = raw.trim()
  if (!line) continue
  if (!line.startsWith('- ')) {
    realm = slug(line)
    continue
  }
  const files = line.slice(2).split(/\s+/)
  const map = files[0].split('.')[0]
  files.forEach((file, index) => jobs.push({ realm, map, file, number: index + 1 }))
}

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

let done = 0
let failed = 0
async function run(job) {
  const folder = join(OUT, job.realm, job.map)
  const target = join(folder, job.number + '.webp')
  if (await exists(target)) return
  try {
    const response = await fetch(BASE + job.file)
    if (!response.ok) throw new Error('HTTP ' + response.status)
    await mkdir(folder, { recursive: true })
    await writeFile(target, Buffer.from(await response.arrayBuffer()))
    done++
  } catch (error) {
    failed++
    console.log('FAILED ' + job.realm + '/' + job.map + '/' + job.number + ': ' + error.message)
  }
}

const queue = [...jobs]
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (queue.length > 0) await run(queue.shift())
  })
)
console.log('Downloaded ' + done + ' images, ' + failed + ' failed. Folder: ' + OUT)
