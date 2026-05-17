export interface ComboboxItem {
  value: string;
  label: string;
  hint?: string;
}

export interface ComboboxOptions {
  input: HTMLInputElement;
  list: HTMLUListElement;
  onChange: (value: string) => void;
}

export class Combobox {
  private items: ComboboxItem[] = [];
  private filtered: ComboboxItem[] = [];
  private value = '';
  private highlighted = -1;
  private isOpen = false;

  constructor(private readonly opts: ComboboxOptions) {
    this.opts.input.setAttribute('role', 'combobox');
    this.opts.input.setAttribute('aria-autocomplete', 'list');
    this.opts.input.setAttribute('aria-expanded', 'false');
    this.opts.list.setAttribute('role', 'listbox');

    this.opts.input.addEventListener('focus', () => this.open());
    this.opts.input.addEventListener('input', () => this.handleInput());
    this.opts.input.addEventListener('keydown', (e) => this.handleKey(e));
    this.opts.input.addEventListener('blur', () => {
      window.setTimeout(() => this.close(), 120);
    });
    this.opts.list.addEventListener('mousedown', (e) => e.preventDefault());
  }

  setItems(items: ComboboxItem[]): void {
    this.items = items;
    this.filtered = items;
    this.render();
  }

  setValue(value: string): void {
    this.value = value;
    const found = this.items.find((i) => i.value === value);
    this.opts.input.value = found ? found.label : value;
  }

  getValue(): string {
    return this.value;
  }

  private handleInput(): void {
    const query = this.opts.input.value.trim().toLowerCase();
    this.filtered = query
      ? this.items.filter(
          (i) => i.label.toLowerCase().includes(query) || i.value.toLowerCase().includes(query),
        )
      : this.items;
    this.highlighted = this.filtered.length > 0 ? 0 : -1;
    this.render();
    this.open();
  }

  private handleKey(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!this.isOpen) this.open();
        this.highlighted = Math.min(this.highlighted + 1, this.filtered.length - 1);
        this.render();
        this.scrollToHighlighted();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.highlighted = Math.max(this.highlighted - 1, 0);
        this.render();
        this.scrollToHighlighted();
        break;
      case 'Enter':
        e.preventDefault();
        if (this.highlighted >= 0 && this.filtered[this.highlighted]) {
          this.select(this.filtered[this.highlighted]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        this.close();
        this.setValue(this.value);
        break;
    }
  }

  private open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.opts.list.hidden = false;
    this.opts.input.setAttribute('aria-expanded', 'true');
    if (this.highlighted < 0 && this.value) {
      const idx = this.filtered.findIndex((i) => i.value === this.value);
      if (idx >= 0) {
        this.highlighted = idx;
        this.render();
        this.scrollToHighlighted();
      }
    }
  }

  private close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.opts.list.hidden = true;
    this.opts.input.setAttribute('aria-expanded', 'false');
    this.setValue(this.value);
  }

  private select(item: ComboboxItem): void {
    this.value = item.value;
    this.opts.input.value = item.label;
    this.close();
    this.opts.onChange(item.value);
  }

  private render(): void {
    this.opts.list.innerHTML = '';
    if (this.filtered.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'combobox-empty';
      empty.textContent = 'No matches';
      this.opts.list.appendChild(empty);
      return;
    }
    this.filtered.forEach((item, idx) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.className = 'combobox-item';
      if (idx === this.highlighted) li.classList.add('highlighted');
      if (item.value === this.value) li.classList.add('selected');
      li.dataset.value = item.value;
      li.textContent = item.label;
      if (item.hint) {
        const hint = document.createElement('span');
        hint.className = 'combobox-hint';
        hint.textContent = item.hint;
        li.appendChild(hint);
      }
      li.addEventListener('mouseenter', () => {
        this.highlighted = idx;
        this.updateHighlightClasses();
      });
      li.addEventListener('click', () => this.select(item));
      this.opts.list.appendChild(li);
    });
  }

  private updateHighlightClasses(): void {
    const items = this.opts.list.querySelectorAll<HTMLLIElement>('.combobox-item');
    items.forEach((el, idx) => el.classList.toggle('highlighted', idx === this.highlighted));
  }

  private scrollToHighlighted(): void {
    const el = this.opts.list.querySelectorAll<HTMLLIElement>('.combobox-item')[this.highlighted];
    el?.scrollIntoView({ block: 'nearest' });
  }
}
