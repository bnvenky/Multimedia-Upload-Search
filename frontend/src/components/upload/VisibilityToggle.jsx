import { Globe, Lock } from 'lucide-react';
import { labelClass } from '../../utils/styles';
import Segmented from '../common/Segmented';

const OPTIONS = [
  { value: 'public', label: 'Public', icon: Globe },
  { value: 'private', label: 'Private', icon: Lock },
];

const VisibilityToggle = ({ value, onChange }) => (
  <div className="grid gap-1.5">
    <span className={labelClass}>Visibility</span>
    <Segmented label="Visibility" mode="radio" wide options={OPTIONS} value={value} onChange={onChange} />
  </div>
);

export default VisibilityToggle;
