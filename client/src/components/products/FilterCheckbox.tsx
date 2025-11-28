interface FilterCheckboxProps {
  label?: string;
  checked?: boolean;
  onChange?: () => void;
}

export const FilterCheckbox = ({ label, checked, onChange }: FilterCheckboxProps) => (
  <label className="flex items-center cursor-pointer text-sm group py-1.5 px-1 rounded transition-colors hover:bg-gray-50">
    <div className="relative flex items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 cursor-pointer accent-black border-gray-300 rounded  checked:border-0 outline-none focus:outline-none"
      />
    </div>
    <span className="ml-2 text-gray-700 group-hover:text-black transition-colors">{label}</span>
  </label>
);

