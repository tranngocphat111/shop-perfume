import { motion } from 'framer-motion';

export const ContactMap = () => {
  // Google Maps embed URL - Tắt popup bằng cách thêm &output=embed&iwloc=near
  const mapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.723124158088!2d106.6611968!3d10.8324879!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752909abff0119%3A0x3cf45955d8c261a3!2zMTI0IMSQxrDhu51uZyBT4buRIDE3LCBQaMaw4budbmcgMTEsIEfDsiBW4bqlcCwgVGjDoG5oIHBo4buRIEjhu5MgQ2jDrSBNaW5oIDcwMDAwMA!5e0!3m2!1svi!2s!4v1764405268398!5m2!1svi!2s&output=embed&iwloc=near";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-2xl font-semibold text-gray-900">Vị trí cửa hàng</h3>
        <p className="text-sm text-gray-500 mt-1">Tìm đường đến cửa hàng của chúng tôi</p>
      </div>
      <div className="relative w-full h-[400px] md:h-[500px]">
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-full"
          title="Store Location"
        />
      </div>
      <div className="p-6 bg-gray-50">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Địa chỉ:</span> 124 Đường số 17, Phường 11, Quận Gò Vấp, TP. Hồ Chí Minh
        </p>
        <a
          href="https://www.google.com/maps/search/?api=1&query=124+Đường+số+17,+Phường+11,+Quận+Gò+Vấp,+TP.+Hồ+Chí+Minh"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-gray-900 hover:text-black transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Mở trong Google Maps
        </a>
      </div>
    </motion.div>
  );
};

