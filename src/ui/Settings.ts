import { SettingsService } from '@/services/settings';
import type { AudioManager } from '@/core/AudioManager';
import { t } from '@/shared/i18n';
import type { QualityLevel } from '@/shared/types';

export interface SettingsCallbacks {
  onClose: () => void;
  onQualityChange?: (quality: QualityLevel) => void;
  /** Gọi khi người dùng chọn "Tự động" → bật adaptive quality */
  onAdaptiveQuality?: () => void;
}

export class SettingsModal {
  private element: HTMLElement | null = null;
  private settingsService: SettingsService;
  private audio: AudioManager;
  private callbacks: SettingsCallbacks;

  constructor(
    settingsService: SettingsService,
    audio: AudioManager,
    callbacks: SettingsCallbacks,
  ) {
    this.settingsService = settingsService;
    this.audio = audio;
    this.callbacks = callbacks;
  }

  mount(parent: HTMLElement): void {
    this.unmount();

    const root = document.createElement('div');
    root.className = 'settings-modal-backdrop';

    const modal = document.createElement('div');
    modal.className = 'settings-modal-card';

    // Header
    const header = document.createElement('div');
    header.className = 'settings-header';

    const title = document.createElement('h3');
    title.className = 'settings-title';
    title.textContent = t('settings_title');

    const closeBtn = document.createElement('button');
    closeBtn.className = 'history-close-btn';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => {
      this.callbacks.onClose();
    });

    header.appendChild(title);
    header.appendChild(closeBtn);
    modal.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'settings-body';

    const current = this.settingsService.settings;

    // 1. Tùy chọn âm thanh
    const soundGroup = document.createElement('div');
    soundGroup.className = 'settings-group';

    const soundLabel = document.createElement('label');
    soundLabel.textContent = `${t('settings_volume')}: ${Math.round(current.volume * 100)}%`;

    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.min = '0';
    volumeSlider.max = '1';
    volumeSlider.step = '0.05';
    volumeSlider.value = current.volume.toString();
    volumeSlider.className = 'settings-slider';
    volumeSlider.addEventListener('input', () => {
      const vol = parseFloat(volumeSlider.value);
      this.audio.setVolume(vol);
      soundLabel.textContent = `${t('settings_volume')}: ${Math.round(vol * 100)}%`;
    });

    const muteRow = document.createElement('div');
    muteRow.className = 'settings-checkbox-row';
    const muteCheckbox = document.createElement('input');
    muteCheckbox.type = 'checkbox';
    muteCheckbox.id = 'chk-mute';
    muteCheckbox.checked = current.muted;
    muteCheckbox.addEventListener('change', () => {
      this.audio.setMuted(muteCheckbox.checked);
    });

    const muteLabel = document.createElement('label');
    muteLabel.htmlFor = 'chk-mute';
    muteLabel.textContent = t('settings_mute');

    muteRow.appendChild(muteCheckbox);
    muteRow.appendChild(muteLabel);

    soundGroup.appendChild(soundLabel);
    soundGroup.appendChild(volumeSlider);
    soundGroup.appendChild(muteRow);
    body.appendChild(soundGroup);

    // 2. Tùy chọn chất lượng đồ họa
    const qualityGroup = document.createElement('div');
    qualityGroup.className = 'settings-group';

    const qualityLabel = document.createElement('label');
    qualityLabel.textContent = t('settings_quality');

    const qualitySelect = document.createElement('select');
    qualitySelect.className = 'form-select';

    // Mục "Tự động" đứng đầu danh sách
    const autoOpt = document.createElement('option');
    autoOpt.value = 'auto';
    autoOpt.textContent = '🤖 Tự động (khuyến nghị)';
    qualitySelect.appendChild(autoOpt);

    const levels: { id: QualityLevel; name: string }[] = [
      { id: 'low', name: 'Tiết kiệm pin (Thấp)' },
      { id: 'medium', name: 'Cân bằng (Vừa)' },
      { id: 'high', name: 'Đồ họa sắc nét (Cao)' },
    ];

    for (const lvl of levels) {
      const opt = document.createElement('option');
      opt.value = lvl.id;
      opt.textContent = lvl.name;
      if (current.quality === lvl.id) opt.selected = true;
      qualitySelect.appendChild(opt);
    }

    qualitySelect.addEventListener('change', () => {
      const val = qualitySelect.value;
      if (val === 'auto') {
        // Người dùng chọn "Tự động" → bật adaptive, không lưu mức cứng
        if (this.callbacks.onAdaptiveQuality) {
          this.callbacks.onAdaptiveQuality();
        }
      } else {
        const q = val as QualityLevel;
        this.settingsService.save({ quality: q });
        if (this.callbacks.onQualityChange) {
          this.callbacks.onQualityChange(q);
        }
      }
    });

    qualityGroup.appendChild(qualityLabel);
    qualityGroup.appendChild(qualitySelect);
    body.appendChild(qualityGroup);

    // 3. Tùy chọn giảm chuyển động
    const motionGroup = document.createElement('div');
    motionGroup.className = 'settings-checkbox-row';
    const motionCheckbox = document.createElement('input');
    motionCheckbox.type = 'checkbox';
    motionCheckbox.id = 'chk-motion';
    motionCheckbox.checked = current.reducedMotion;
    motionCheckbox.addEventListener('change', () => {
      this.settingsService.save({ reducedMotion: motionCheckbox.checked });
    });

    const motionLabel = document.createElement('label');
    motionLabel.htmlFor = 'chk-motion';
    motionLabel.textContent = t('settings_reduced_motion');

    motionGroup.appendChild(motionCheckbox);
    motionGroup.appendChild(motionLabel);
    body.appendChild(motionGroup);

    modal.appendChild(body);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'settings-footer';
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.textContent = t('settings_close');
    saveBtn.addEventListener('click', () => {
      this.callbacks.onClose();
    });
    footer.appendChild(saveBtn);
    modal.appendChild(footer);

    root.appendChild(modal);
    this.element = root;
    parent.appendChild(root);
  }

  unmount(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
