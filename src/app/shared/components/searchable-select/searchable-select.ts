import { Component, input, model, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

export interface SelectOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-searchable-select',
  imports: [FormsModule, MatIconModule, MatInputModule, MatAutocompleteModule],
  template: `
    <mat-form-field appearance="outline" class="searchable-select">
      <mat-icon matIconPrefix>search</mat-icon>
      <input
        matInput
        [matAutocomplete]="auto"
        [placeholder]="placeholder()"
        [ngModel]="inputValue()"
        (ngModelChange)="onInputChange($event)"
        (focus)="onFocus()"
      />
      <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onOptionSelected($event)" class="searchable-autocomplete">
        @if (filteredOptions().length === 0) {
          <mat-option disabled class="no-result">Sin resultados</mat-option>
        }
        @for (opt of filteredOptions(); track opt.id) {
          <mat-option [value]="opt.id">{{ opt.label }}</mat-option>
        }
      </mat-autocomplete>
    </mat-form-field>
  `,
  styles: [`
    .searchable-select { width: 100%; }
  `],
})
export class SearchableSelect {
  readonly options = input<SelectOption[]>([]);
  readonly placeholder = input('Seleccionar');
  readonly selected = model<string | null>(null);

  readonly inputValue = signal('');
  private selectedLabel = '';

  readonly filteredOptions = computed(() => {
    const q = this.inputValue().toLowerCase().trim();
    if (!q) return this.options();
    return this.options().filter(
      o => o.label.toLowerCase().includes(q)
    );
  });

  onFocus() {
    const sel = this.selected();
    if (sel) {
      const opt = this.options().find(o => o.id === sel);
      if (opt) this.inputValue.set(opt.label);
    }
  }

  onInputChange(value: string) {
    this.inputValue.set(value);
  }

  onOptionSelected(event: any) {
    const id = event.option.value as string;
    const opt = this.options().find(o => o.id === id);
    this.selected.set(id);
    this.inputValue.set(opt?.label || '');
  }
}
