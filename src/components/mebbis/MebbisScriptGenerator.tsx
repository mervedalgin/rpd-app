"use client";

import React, { useState } from 'react';
import { Copy, Download, Play, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MebbisFormData, MebbisBulkFormData } from '@/types/mebbis';

interface MebbisScriptGeneratorProps {
  formData: MebbisFormData | null;
  bulkData?: MebbisBulkFormData;
}

const MebbisScriptGenerator: React.FC<MebbisScriptGeneratorProps> = ({ formData, bulkData }) => {
  const [copied, setCopied] = useState(false);

  const isBulkMode = !!(bulkData?.isBulkMode && (bulkData?.records?.length ?? 0) > 0);
  const recordsToProcess: MebbisFormData[] = isBulkMode
    ? (bulkData?.records ?? [])
    : (formData ? [formData] : []);

  const formatDateForSystem = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const generateScript = (): string => {
    if (recordsToProcess.length === 0) {
      return '# Hata: İşlenecek kayıt bulunamadı';
    }

    const firstRecord = recordsToProcess[0];
    const formattedDate = formatDateForSystem(firstRecord.gorusmeTarihi);
    const formattedDateAlt = formattedDate.replace(/\//g, '.');

    const bulkDataSection = isBulkMode ? `
# ==== ÇOKLU KAYIT VERİLERİ ====
RECORDS_DATA = [
${recordsToProcess.map((record, index) => `    {
        "sinif_sube": "${record.sinifSube}",
        "ogrenci": "${record.ogrenci}",
        "hizmet_turu": "${record.rpdHizmetTuru}",
        "asama1": "${record.asama1}",
        "asama2": "${record.asama2}",
        "asama3": ${record.asama3 ? `"${record.asama3}"` : 'None'},
        "tarih": "${formatDateForSystem(record.gorusmeTarihi)}",
        "tarih_alt": "${formatDateForSystem(record.gorusmeTarihi).replace(/\//g, '.')}",
        "saat_bas": "${record.gorusmeBaslamaSaati}",
        "saat_bitis": "${record.gorusmeBitisSaati}",
        "calisma_yeri": "${record.calismaYeri}"
    }${index < recordsToProcess.length - 1 ? ',' : ''}`).join('\n')}
]
` : '';

    const singleDataSection = !isBulkMode ? `
# ==== doldurulacak alanlar ====
SINIF_SUBE_VAL = "${firstRecord.sinifSube}"
OGRENCi_VAL    = "${firstRecord.ogrenci}"
HIZMET_TURU    = "${firstRecord.rpdHizmetTuru}"
ASAMA1_VAL     = "${firstRecord.asama1}"
ASAMA2_VAL     = "${firstRecord.asama2}"
ASAMA3_VAL     = ${firstRecord.asama3 ? `"${firstRecord.asama3}"` : 'None'}      # gerek yoksa None yap
TARIH_1        = "${formattedDate}"
TARIH_2        = "${formattedDateAlt}"
SAAT_BAS       = "${firstRecord.gorusmeBaslamaSaati}"
SAAT_BITIS     = "${firstRecord.gorusmeBitisSaati}"
CALISMA_YERI   = "${firstRecord.calismaYeri}"
` : '';

    const header = `# -*- coding: utf-8 -*-
"""
MEBBİS RPD Otomasyonu ${isBulkMode ? '(ÇOKLU KAYIT)' : '(TEKLİ KAYIT)'}
- undetected-chromedriver -> webdriver-manager -> PATH üç aşamalı sürücü başlatma
- Login'i sen geçersin; hedef sayfa URL/DOM sinyaliyle algılanır
- 'Yeni' -> form doldurma -> 'Kaydet'
- Date/time picker popupları: JS ile gizleme + görünmezliği bekleme
- Saat alanları: JS ile set + input/change/blur tetikleme
${isBulkMode ? `- ÇOKLU KAYIT: ${recordsToProcess.length} adet kayıt sırayla işlenecek` : ''}
"""

import os, time, datetime, random
from urllib.parse import urlparse

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException, StaleElementReferenceException
from selenium.webdriver.common.keys import Keys

try:
    import undetected_chromedriver as uc
except Exception:
    uc = None

try:
    from webdriver_manager.chrome import ChromeDriverManager
    from selenium.webdriver.chrome.service import Service
except Exception:
    ChromeDriverManager = None
    Service = None

try:
    from fake_useragent import UserAgent
except Exception:
    UserAgent = None


# ==== hedef & bekleme ====
URL_START = "https://mebbis.meb.gov.tr/ERH/ERH01003.aspx"
URL_TARGET_PATH = "/ERH/ERH01003.aspx"
WAIT = 25
${bulkDataSection}${singleDataSection}
# ==== XPATH'ler ====
XP_YENI          = '//*[@id="ramToolBar1_imgButtonyeni"]'
XP_SINIF_SUBE    = '//*[@id="drpsinifsube"]'
XP_OGRENCI       = '//*[@id="drpOgrenci"]'
XP_HIZMET_TURU   = '//*[@id="drp_hizmet_alani"]'
XP_ASAMA1        = '//*[@id="drp_bir"]'
XP_ASAMA2        = '//*[@id="drp_iki"]'
XP_ASAMA3        = '//*[@id="drp_uc"]'
XP_TARIH         = '//*[@id="txtgorusmetarihi"]'
XP_SAAT_BAS      = '//*[@id="txtgorusmesaati"]'
XP_SAAT_BITIS    = '//*[@id="txtgorusmebitissaati"]'
XP_CALISMA_YERI  = '//*[@id="cmbCalismaYeri"]'
XP_KAYDET        = '//*[@id="ramToolBar1_imgButtonKaydet"]'
XP_POPUP_DISMISS_CELL = '//*[@id="tableOgrenci"]/tbody/tr[10]/td[4]'


# ==== yardımcılar ====
def random_user_agent():
    if UserAgent:
        try:
            return UserAgent(browsers=['chrome']).random
        except Exception:
            pass
    pool = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.199 Safari/537.36",
    ]
    return random.choice(pool)

def chrome_options_base():
    opts = Options()
    opts.add_argument("--disable-blink-features=AutomationControlled")
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    opts.add_experimental_option('useAutomationExtension', False)
    opts.add_argument(f"--user-agent={random_user_agent()}")
    return opts

def build_driver():
    last_err = None
    if uc is not None:
        try:
            d = uc.Chrome(options=chrome_options_base(), use_subprocess=True)
            try:
                d.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            except Exception:
                pass
            d.maximize_window()
            print("[Driver] undetected-chromedriver ile başlatıldı.")
            return d
        except Exception as e:
            last_err = e
            print("[Driver] uc başarısız:", e)

    if ChromeDriverManager is not None and Service is not None:
        try:
            exe = ChromeDriverManager().install()
            d = webdriver.Chrome(service=Service(executable_path=exe), options=chrome_options_base())
            try:
                d.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            except Exception:
                pass
            d.maximize_window()
            print("[Driver] webdriver-manager ile başlatıldı.")
            return d
        except Exception as e:
            last_err = e
            print("[Driver] webdriver-manager başarısız:", e)

    try:
        d = webdriver.Chrome(options=chrome_options_base())
        try:
            d.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        except Exception:
            pass
        d.maximize_window()
        print("[Driver] PATH'teki chromedriver ile başlatıldı.")
        return d
    except Exception as e:
        last_err = e
        print("[Driver] PATH yöntemi başarısız:", e)

    raise RuntimeError(f"Sürücü başlatılamadı: {last_err}")

def wait_dom_ready(drv):
    WebDriverWait(drv, WAIT).until(lambda d: d.execute_script("return document.readyState") == "complete")

def wait_updatepanel_idle(drv, timeout=WAIT):
    end = time.time() + timeout
    while time.time() < end:
        try:
            in_async = drv.execute_script(
                "try{var prm=window.Sys&&Sys.WebForms&&Sys.WebForms.PageRequestManager.getInstance();"
                "return prm ? prm.get_isInAsyncPostBack() : false;}catch(e){return false;}"
            )
            if not in_async:
                time.sleep(0.12)
                return
        except Exception:
            pass
        time.sleep(0.2)

def wait_options_populated_xpath(drv, xpath, min_count=2, timeout=WAIT):
    def _loaded(d):
        try:
            el = d.find_element(By.XPATH, xpath)
            return len(el.find_elements(By.TAG_NAME, "option")) >= min_count
        except Exception:
            return False
    WebDriverWait(drv, timeout).until(_loaded)
    wait_updatepanel_idle(drv)

def select_by_value_xpath(drv, xpath, value):
    sel = Select(WebDriverWait(drv, WAIT).until(EC.presence_of_element_located((By.XPATH, xpath))))
    try:
        sel.select_by_value(value)
    except Exception:
        opts = [(o.get_attribute("value"), (o.text or "").strip()) for o in sel.options]
        raise ValueError(f"[{xpath}] value='{value}' bulunamadı. Mevcut: {opts}")

def js_click(drv, el):
    try:
        drv.execute_script("arguments[0].click();", el)
    except Exception:
        el.click()

def debug_dump(drv, tag="debug"):
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    fn_png = f"mebbis_{tag}_{ts}.png"
    fn_html = f"mebbis_{tag}_{ts}.html"
    try:
        drv.save_screenshot(fn_png)
        with open(fn_html, "w", encoding="utf-8") as f:
            f.write(drv.page_source)
        print(f"[DEBUG] Screenshot: {os.path.abspath(fn_png)}")
        print(f"[DEBUG] HTML dump : {os.path.abspath(fn_html)}")
    except Exception as ex:
        print("[DEBUG] Dump hatası:", ex)

def switch_to_newest_window(driver):
    try:
        handles = driver.window_handles
        driver.switch_to.window(handles[-1])
    except Exception:
        pass

def url_is_target(current: str) -> bool:
    try:
        u = urlparse(current)
        host = (u.netloc or "").lower()
        path = (u.path or "").lower()
        host_ok = host.endswith("meb.gov.tr") and ("mebbis" in host)
        path_ok = path.endswith(URL_TARGET_PATH.lower())
        return host_ok and path_ok
    except Exception:
        return False

def dom_looks_target(driver) -> bool:
    try:
        if driver.find_elements(By.XPATH, XP_YENI): return True
        if driver.find_elements(By.XPATH, XP_SINIF_SUBE): return True
    except Exception:
        pass
    return False

def hide_known_pickers_js(driver):
    js = """
    (function(){
      var changed=false;
      var d=document;
      var dp=d.querySelector('#ui-datepicker-div');
      if(dp && dp.style.display!=='none'){ dp.style.display='none'; changed=true; }
      var tpList=d.querySelectorAll('.ui-timepicker-div, .ui-timepicker-container, .ui-timepicker-wrapper');
      if(tpList && tpList.length){
        tpList.forEach(function(e){ if(getComputedStyle(e).display!=='none'){ e.style.display='none'; changed=true; }});
      }
      var overlay=d.querySelector('.ui-widget-overlay');
      if(overlay && overlay.style.display!=='none'){ overlay.style.display='none'; changed=true; }
      return changed;
    })();
    """
    try:
        return bool(driver.execute_script(js))
    except Exception:
        return False

def wait_pickers_invisible(driver, timeout=5):
    try:
        WebDriverWait(driver, timeout).until(EC.invisibility_of_element_located((By.ID, "ui-datepicker-div")))
    except Exception:
        pass
    for css in [".ui-timepicker-div", ".ui-timepicker-container", ".ui-timepicker-wrapper", ".ui-widget-overlay"]:
        try:
            WebDriverWait(driver, 1).until(EC.invisibility_of_element_located((By.CSS_SELECTOR, css)))
        except Exception:
            pass

def dismiss_popup_soft(driver):
    changed = hide_known_pickers_js(driver)
    if changed:
        wait_pickers_invisible(driver, timeout=3)
        return True

    try:
        cell = driver.find_element(By.XPATH, XP_POPUP_DISMISS_CELL)
        js_click(driver, cell)
        time.sleep(0.2)
        changed |= hide_known_pickers_js(driver)
        if changed:
            wait_pickers_invisible(driver, timeout=3)
            return True
    except Exception:
        pass

    try:
        body = driver.find_element(By.TAG_NAME, "body")
        js_click(driver, body)
        time.sleep(0.2)
        changed |= hide_known_pickers_js(driver)
        if changed:
            wait_pickers_invisible(driver, timeout=3)
            return True
    except Exception:
        pass

    try:
        driver.switch_to.active_element.send_keys(Keys.ESCAPE)
        time.sleep(0.2)
        changed |= hide_known_pickers_js(driver)
        if changed:
            wait_pickers_invisible(driver, timeout=3)
            return True
    except Exception:
        pass

    return False

def set_input_value_js(driver, xpath, value):
    el = WebDriverWait(driver, WAIT).until(EC.presence_of_element_located((By.XPATH, xpath)))
    driver.execute_script("""
        const el = arguments[0], val = arguments[1];
        el.value = val;
        el.dispatchEvent(new Event('input', {bubbles:true}));
        el.dispatchEvent(new Event('change', {bubbles:true}));
        el.dispatchEvent(new Event('blur', {bubbles:true}));
    """, el, value)
    return el

def wait_until_target_ready(driver, timeout=600):
    print("\\nLogin işlemlerini tamamlayın ve hedef sayfaya gidin...")
    print(f"Hedef URL: {URL_START}")
    print("Maksimum bekleme süresi: 10 dakika")

    end = time.time() + timeout
    while time.time() < end:
        try:
            switch_to_newest_window(driver)
            current = driver.current_url

            if url_is_target(current) and dom_looks_target(driver):
                print("\\n✓ Sayfa Bulundu Veri Girmeye Hazır")
                return True

            remaining = int(end - time.time())
            print(f"\\rBekleniyor... Kalan süre: {remaining}s", end="", flush=True)

        except Exception as e:
            print(f"\\n[HATA] Sayfa kontrolü: {e}")

        time.sleep(3)

    print("\\n[ZAMAN AŞIMI] Hedef sayfaya ulaşılamadı!")
    return False
`;

    const bulkMain = `
def process_single_record(driver, record_data, record_index):
    print(f"\\n--- KAYIT {record_index + 1}/{len(RECORDS_DATA)} ---")
    print(f"Öğrenci: {record_data['ogrenci']} | Tarih: {record_data['tarih']}")

    print("'Yeni' butonuna tıklanıyor...")
    yeni_btn = WebDriverWait(driver, WAIT).until(EC.element_to_be_clickable((By.XPATH, XP_YENI)))
    js_click(driver, yeni_btn)
    time.sleep(2)
    wait_updatepanel_idle(driver)
    print("✓ Yeni kayıt formu açıldı")

    print("Form alanları dolduruluyor...")

    print("Sınıf/Şube seçiliyor...")
    wait_options_populated_xpath(driver, XP_SINIF_SUBE)
    select_by_value_xpath(driver, XP_SINIF_SUBE, record_data['sinif_sube'])
    time.sleep(1)
    wait_updatepanel_idle(driver)
    print("✓ Sınıf/Şube seçildi")

    print("Öğrenci seçiliyor...")
    wait_options_populated_xpath(driver, XP_OGRENCI)
    select_by_value_xpath(driver, XP_OGRENCI, record_data['ogrenci'])
    time.sleep(1)
    wait_updatepanel_idle(driver)
    print("✓ Öğrenci seçildi")

    print("RPD Hizmet Türü seçiliyor...")
    wait_options_populated_xpath(driver, XP_HIZMET_TURU)
    select_by_value_xpath(driver, XP_HIZMET_TURU, record_data['hizmet_turu'])
    time.sleep(1)
    wait_updatepanel_idle(driver)
    print("✓ RPD Hizmet Türü seçildi")

    print("1. Aşama seçiliyor...")
    wait_options_populated_xpath(driver, XP_ASAMA1)
    select_by_value_xpath(driver, XP_ASAMA1, record_data['asama1'])
    time.sleep(1)
    wait_updatepanel_idle(driver)
    print("✓ 1. Aşama seçildi")

    print("2. Aşama seçiliyor...")
    wait_options_populated_xpath(driver, XP_ASAMA2)
    select_by_value_xpath(driver, XP_ASAMA2, record_data['asama2'])
    time.sleep(1)
    wait_updatepanel_idle(driver)
    print("✓ 2. Aşama seçildi")

    if record_data['asama3'] is not None:
        print("3. Aşama seçiliyor...")
        wait_options_populated_xpath(driver, XP_ASAMA3)
        select_by_value_xpath(driver, XP_ASAMA3, record_data['asama3'])
        time.sleep(1)
        wait_updatepanel_idle(driver)
        print("✓ 3. Aşama seçildi")
    else:
        print("3. Aşama atlanıyor (opsiyonel)")

    print("Görüşme tarihi giriliyor...")
    dismiss_popup_soft(driver)
    set_input_value_js(driver, XP_TARIH, record_data['tarih'])
    time.sleep(0.5)
    dismiss_popup_soft(driver)
    print("✓ Görüşme tarihi girildi")

    print("Başlama saati giriliyor...")
    dismiss_popup_soft(driver)
    set_input_value_js(driver, XP_SAAT_BAS, record_data['saat_bas'])
    time.sleep(0.5)
    dismiss_popup_soft(driver)
    print("✓ Başlama saati girildi")

    print("Bitiş saati giriliyor...")
    dismiss_popup_soft(driver)
    set_input_value_js(driver, XP_SAAT_BITIS, record_data['saat_bitis'])
    time.sleep(0.5)
    dismiss_popup_soft(driver)
    print("✓ Bitiş saati girildi")

    print("Çalışma yeri seçiliyor...")
    wait_options_populated_xpath(driver, XP_CALISMA_YERI)
    select_by_value_xpath(driver, XP_CALISMA_YERI, record_data['calisma_yeri'])
    time.sleep(1)
    print("✓ Çalışma yeri seçildi")

    print("Kaydetme işlemi...")
    kaydet_btn = WebDriverWait(driver, WAIT).until(EC.element_to_be_clickable((By.XPATH, XP_KAYDET)))
    js_click(driver, kaydet_btn)
    time.sleep(3)

    try:
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'başarı') or contains(text(), 'kaydedildi') or contains(text(), 'Kayıt')]"))
        )
        print(f"✓ Kayıt {record_index + 1} başarıyla kaydedildi!")
    except:
        print(f"✓ Kayıt {record_index + 1} gönderildi. Lütfen sonucu kontrol edin.")

    print(f"=== KAYIT {record_index + 1} TAMAMLANDI ===")
    time.sleep(2)

def main():
    driver = None
    try:
        print("\\n=== MEBBİS RPD OTOMASYONU (ÇOKLU KAYIT) ===")
        print(f"Toplam işlenecek kayıt sayısı: {len(RECORDS_DATA)}")

        driver = build_driver()

        print(f"\\n[1] Hedef sayfaya yönlendirme: {URL_START}")
        driver.get(URL_START)
        time.sleep(2)

        print("\\n[2] Hedef sayfa bekleniyor...")
        if not wait_until_target_ready(driver):
            return

        wait_dom_ready(driver)
        time.sleep(1)

        print("\\n[3] Çoklu kayıt işleme başlıyor...")
        success_count = 0

        for i, record in enumerate(RECORDS_DATA):
            try:
                process_single_record(driver, record, i)
                success_count += 1
            except Exception as e:
                print(f"\\n❌ KAYIT {i + 1} HATASI: {e}")
                debug_dump(driver, f"error_record_{i+1}")
                print("Sonraki kayda geçiliyor...")
                time.sleep(2)

        print("\\n✓✓✓ İŞLEM TAMAMLANDI! ✓✓✓")
        print(f"Başarılı kayıt: {success_count}/{len(RECORDS_DATA)}")

    except Exception as e:
        print(f"\\n❌ GENEL HATA: {e}")
        if driver:
            debug_dump(driver, "general_error")

    finally:
        if driver:
            print("\\nTarayıcıyı kapatmak için Enter'a basın...")
            try:
                input()
            except (EOFError, KeyboardInterrupt):
                pass
            driver.quit()

if __name__ == "__main__":
    main()
`;

    const singleMain = `
def main():
    driver = None
    try:
        print("\\n=== MEBBİS RPD OTOMASYONU (TEKLİ KAYIT) ===")
        driver = build_driver()

        print(f"\\n[1] Hedef sayfaya yönlendirme: {URL_START}")
        driver.get(URL_START)
        time.sleep(2)

        print("\\n[2] Hedef sayfa bekleniyor...")
        if not wait_until_target_ready(driver):
            return

        wait_dom_ready(driver)
        time.sleep(1)

        print("\\n[3] 'Yeni' butonuna tıklanıyor...")
        yeni_btn = WebDriverWait(driver, WAIT).until(EC.element_to_be_clickable((By.XPATH, XP_YENI)))
        js_click(driver, yeni_btn)
        time.sleep(2)
        wait_updatepanel_idle(driver)
        print("✓ Yeni kayıt formu açıldı")

        print("\\n[4] Form alanları dolduruluyor...")

        print("Sınıf/Şube seçiliyor...")
        wait_options_populated_xpath(driver, XP_SINIF_SUBE)
        select_by_value_xpath(driver, XP_SINIF_SUBE, SINIF_SUBE_VAL)
        time.sleep(1)
        wait_updatepanel_idle(driver)
        print("✓ Sınıf/Şube seçildi")

        print("Öğrenci seçiliyor...")
        wait_options_populated_xpath(driver, XP_OGRENCI)
        select_by_value_xpath(driver, XP_OGRENCI, OGRENCi_VAL)
        time.sleep(1)
        wait_updatepanel_idle(driver)
        print("✓ Öğrenci seçildi")

        print("RPD Hizmet Türü seçiliyor...")
        wait_options_populated_xpath(driver, XP_HIZMET_TURU)
        select_by_value_xpath(driver, XP_HIZMET_TURU, HIZMET_TURU)
        time.sleep(1)
        wait_updatepanel_idle(driver)
        print("✓ RPD Hizmet Türü seçildi")

        print("1. Aşama seçiliyor...")
        wait_options_populated_xpath(driver, XP_ASAMA1)
        select_by_value_xpath(driver, XP_ASAMA1, ASAMA1_VAL)
        time.sleep(1)
        wait_updatepanel_idle(driver)
        print("✓ 1. Aşama seçildi")

        print("2. Aşama seçiliyor...")
        wait_options_populated_xpath(driver, XP_ASAMA2)
        select_by_value_xpath(driver, XP_ASAMA2, ASAMA2_VAL)
        time.sleep(1)
        wait_updatepanel_idle(driver)
        print("✓ 2. Aşama seçildi")

        if ASAMA3_VAL is not None:
            print("3. Aşama seçiliyor...")
            wait_options_populated_xpath(driver, XP_ASAMA3)
            select_by_value_xpath(driver, XP_ASAMA3, ASAMA3_VAL)
            time.sleep(1)
            wait_updatepanel_idle(driver)
            print("✓ 3. Aşama seçildi")
        else:
            print("3. Aşama atlanıyor (opsiyonel)")

        print("Görüşme tarihi giriliyor...")
        dismiss_popup_soft(driver)
        set_input_value_js(driver, XP_TARIH, TARIH_1)
        time.sleep(0.5)
        dismiss_popup_soft(driver)
        print("✓ Görüşme tarihi girildi")

        print("Başlama saati giriliyor...")
        dismiss_popup_soft(driver)
        set_input_value_js(driver, XP_SAAT_BAS, SAAT_BAS)
        time.sleep(0.5)
        dismiss_popup_soft(driver)
        print("✓ Başlama saati girildi")

        print("Bitiş saati giriliyor...")
        dismiss_popup_soft(driver)
        set_input_value_js(driver, XP_SAAT_BITIS, SAAT_BITIS)
        time.sleep(0.5)
        dismiss_popup_soft(driver)
        print("✓ Bitiş saati girildi")

        print("Çalışma yeri seçiliyor...")
        wait_options_populated_xpath(driver, XP_CALISMA_YERI)
        select_by_value_xpath(driver, XP_CALISMA_YERI, CALISMA_YERI)
        time.sleep(1)
        print("✓ Çalışma yeri seçildi")

        print("\\n[5] Kaydetme işlemi...")
        kaydet_btn = WebDriverWait(driver, WAIT).until(EC.element_to_be_clickable((By.XPATH, XP_KAYDET)))
        js_click(driver, kaydet_btn)
        time.sleep(3)

        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'başarı') or contains(text(), 'kaydedildi') or contains(text(), 'Kayıt')]"))
            )
            print("\\n✓✓✓ RPD kaydı başarıyla oluşturuldu! ✓✓✓")
        except:
            print("\\n✓ Form gönderildi. Lütfen sonucu MEB sisteminde kontrol edin.")

        print("\\n=== İŞLEM TAMAMLANDI ===")

    except Exception as e:
        print(f"\\n❌ HATA: {e}")
        if driver:
            debug_dump(driver, "error")

    finally:
        if driver:
            print("\\nTarayıcıyı kapatmak için Enter'a basın...")
            try:
                input()
            except (EOFError, KeyboardInterrupt):
                pass
            driver.quit()

if __name__ == "__main__":
    main()
`;

    const mainSection = isBulkMode ? bulkMain : singleMain;

    return header + mainSection;
  };

  const generateJsonData = (): string => {
    if (recordsToProcess.length === 0) {
      return '{}';
    }

    if (isBulkMode) {
      return JSON.stringify({
        mode: "bulk",
        total_records: recordsToProcess.length,
        records: recordsToProcess.map(record => ({
          sinif_sube: record.sinifSube,
          ogrenci: record.ogrenci,
          hizmet_turu: record.rpdHizmetTuru,
          asama1: record.asama1,
          asama2: record.asama2,
          asama3: record.asama3 || null,
          tarih: formatDateForSystem(record.gorusmeTarihi),
          tarih_alt: formatDateForSystem(record.gorusmeTarihi).replace(/\//g, '.'),
          saat_bas: record.gorusmeBaslamaSaati,
          saat_bitis: record.gorusmeBitisSaati,
          calisma_yeri: record.calismaYeri
        }))
      }, null, 2);
    } else {
      const record = recordsToProcess[0];
      return JSON.stringify({
        mode: "single",
        data: {
          sinif_sube: record.sinifSube,
          ogrenci: record.ogrenci,
          hizmet_turu: record.rpdHizmetTuru,
          asama1: record.asama1,
          asama2: record.asama2,
          asama3: record.asama3 || null,
          tarih: formatDateForSystem(record.gorusmeTarihi),
          tarih_alt: formatDateForSystem(record.gorusmeTarihi).replace(/\//g, '.'),
          saat_bas: record.gorusmeBaslamaSaati,
          saat_bitis: record.gorusmeBitisSaati,
          calisma_yeri: record.calismaYeri
        }
      }, null, 2);
    }
  };

  const script = generateScript();
  const jsonData = generateJsonData();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Kopyalama hatası:', err);
    }
  };

  const generateTimestamp = (): string => {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${day}${month}${year}_${hours}${minutes}`;
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('JSON kopyalama hatası:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rpd_${generateTimestamp()}.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rpd_${generateTimestamp()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const requirements = `selenium==4.15.0
webdriver-manager==4.0.1
undetected-chromedriver==3.5.4
fake-useragent==1.4.0
requests==2.31.0`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Oluşturulan Selenium Kodu {isBulkMode && `(${recordsToProcess.length} Kayıt)`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="text-green-500 h-5 w-5" />
            <span className="font-medium text-green-700">
              {isBulkMode ? 'Çoklu kayıt kodu başarıyla oluşturuldu!' : 'Kod başarıyla oluşturuldu!'}
            </span>
          </div>
          <p className="text-sm text-green-600">
            {isBulkMode
              ? `${recordsToProcess.length} adet kayıt için toplu Python kodu oluşturuldu.`
              : 'Aşağıdaki Python kodunu kopyalayarak çalıştırabilirsiniz.'}
          </p>
        </div>

        {/* Requirements */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Gerekli Kütüphaneler (requirements.txt):</h3>
          <div className="relative bg-gray-50 rounded-lg p-3 border">
            <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap">
              {requirements}
            </pre>
            <button
              onClick={() => navigator.clipboard.writeText(requirements)}
              className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 transition-colors"
              title="Kopyala"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Terminalde çalıştırın: <code className="bg-gray-200 px-1 rounded">pip install -r requirements.txt</code>
          </p>
        </div>

        {/* Python Script */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">
              {isBulkMode ? 'Çoklu Kayıt Python Kodu:' : 'Python Automation Kodu:'}
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className={copied ? 'bg-green-100 text-green-700' : ''}
              >
                {copied ? <CheckCircle className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? 'Kopyalandı!' : 'Kopyala'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                İndir
              </Button>
            </div>
          </div>

          <div className="relative bg-gray-900 rounded-lg p-4 border overflow-x-auto max-h-96 overflow-y-auto">
            <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
              {script}
            </pre>
          </div>
        </div>

        {/* JSON Data Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">
              {isBulkMode ? 'Çoklu Kayıt JSON Verisi:' : 'JSON Verisi:'}
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyJson}>
                <Copy className="h-4 w-4 mr-1" />
                JSON Kopyala
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadJson} className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                <Download className="h-4 w-4 mr-1" />
                JSON İndir
              </Button>
            </div>
          </div>

          <div className="relative bg-slate-800 rounded-lg p-4 border overflow-x-auto max-h-48 overflow-y-auto">
            <pre className="text-sm text-blue-300 font-mono whitespace-pre-wrap">
              {jsonData}
            </pre>
          </div>
        </div>

        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <h4 className="font-medium text-amber-800 mb-2">
            {isBulkMode ? 'Çoklu Kayıt Kullanım Talimatları:' : 'Kullanım Talimatları:'}
          </h4>
          <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
            <li>Python 3.7+ ve Chrome tarayıcısının sisteminizde kurulu olduğundan emin olun</li>
            <li>Yukarıdaki requirements.txt dosyasındaki kütüphaneleri yükleyin</li>
            <li>
              Python kodunu <strong>rpd_automation{isBulkMode ? '_bulk' : ''}.py</strong> olarak kaydedin
            </li>
            <li>
              Kodu çalıştırın: <code className="bg-amber-200 px-1 rounded">python rpd_automation{isBulkMode ? '_bulk' : ''}.py</code>
            </li>
            <li>Script 3 adet sürücü yöntemi dener: undetected-chrome, webdriver-manager, PATH</li>
            <li>Tarayıcı açıldığında MEB sistemine manuel giriş yapın</li>
            <li>&quot;Sayfa Bulundu Veri Girmeye Hazır&quot; mesajını gördüğünüzde otomatik işlem başlayacak</li>
            {isBulkMode && (
              <li className="font-medium text-amber-800">
                ÇOKLU KAYIT: {recordsToProcess.length} adet kayıt sırayla işlenecek
              </li>
            )}
            <li>Script popup&apos;ları otomatik kapatacak ve JS ile form doldurma yapacak</li>
            <li>Hata durumunda debug dosyaları (screenshot + HTML) otomatik kaydedilir</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default MebbisScriptGenerator;
